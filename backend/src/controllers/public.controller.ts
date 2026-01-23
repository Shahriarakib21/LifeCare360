import { Request, Response, NextFunction } from 'express';
import Doctor from '../models/postgres/Doctor.model';
import Medicine from '../models/postgres/Medicine.model';
import Rating from '../models/postgres/Rating.model';
import User from '../models/mongodb/User.model';
import Patient from '../models/mongodb/Patient.model';
import TestPrice from '../models/mongodb/TestPrice.model';
import { AppError } from '../middleware/errorHandler';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';

// Search doctors (public)
export const searchDoctors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { specialization, city, experience, rating, page = 1, limit = 20 } = req.query;

    // Check if PostgreSQL is connected
    try {
      await sequelize.authenticate();
    } catch (dbError) {
      // PostgreSQL not available - return empty result
      res.json({
        success: true,
        data: {
          doctors: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0,
          },
        },
        message: 'Database not available. Please configure PostgreSQL to see doctors.',
      });
      return;
    }

    const query: any = {
      isActive: true,
      // Show both verified and unverified doctors (unverified will be marked)
      // Remove isVerified requirement to show all active doctors
    };

    // Don't filter by specialization in DB query - we'll filter by both specialization and name after fetching
    // This allows searching by name even if specialization doesn't match

    if (city) {
      // For JSONB fields, search in the address JSONB field as text
      // Escape single quotes to prevent SQL injection
      const cityStr = typeof city === 'string' ? city : String(city);
      const escapedCity = cityStr.replace(/'/g, "''");
      query[Op.and] = [
        ...(query[Op.and] || []),
        sequelize.literal(`address::text ILIKE '%${escapedCity}%'`),
      ];
    }

    if (experience) {
      query.experience = { [Op.gte]: Number(experience) };
    }

    if (rating) {
      query.rating = { [Op.gte]: Number(rating) };
    }

    // Get doctors from PostgreSQL (get more than needed to filter by name)
    // Don't filter by specialization in DB - we'll filter after fetching names
    const maxResults = specialization ? 100 : 50; // Get more results if searching
    const { count, rows } = await Doctor.findAndCountAll({
      where: query,
      limit: maxResults,
      offset: 0,
      order: [['rating', 'DESC'], ['totalReviews', 'DESC']],
    });

    // Fetch user names for each doctor
    const searchTerm = specialization ? String(specialization).toLowerCase().trim() : '';
    const doctorsWithNames = await Promise.all(
      rows.map(async (doctor) => {
        let name = 'Dr. ' + doctor.specialization;
        let email = doctor.contact?.email || '';

        try {
          const user = await User.findById(doctor.userId);
          if (user && user.profile) {
            const { firstName, lastName } = user.profile;
            if (firstName || lastName) {
              name = `Dr. ${firstName || ''} ${lastName || ''}`.trim();
            }
            email = user.email || email;
          }
        } catch (error) {
          // If user not found, use default name
        }

        return {
          ...doctor.toJSON(),
          name,
          email,
        };
      })
    );
    // Filter by name if specialization parameter was provided (it might be a name search)
    let filteredDoctors = doctorsWithNames;
    if (specialization && searchTerm) {
      filteredDoctors = doctorsWithNames.filter((doctor: any) => {
        const specializationMatch = doctor.specialization?.toLowerCase().includes(searchTerm);
        const nameLower = doctor.name?.toLowerCase() || '';
        const nameMatch = nameLower.includes(searchTerm);
        const matches = specializationMatch || nameMatch;
        return matches;
      });
    }

    // Apply pagination after filtering
    const total = filteredDoctors.length;
    const offset = (Number(page) - 1) * Number(limit);
    const paginatedDoctors = filteredDoctors.slice(offset, offset + Number(limit));

    res.json({
      success: true,
      data: {
        doctors: paginatedDoctors,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    // Handle Sequelize connection errors gracefully
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeDatabaseError') {
      res.json({
        success: true,
        data: {
          doctors: [],
          pagination: {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
            total: 0,
            pages: 0,
          },
        },
        message: 'Database connection error. Please configure PostgreSQL.',
      });
      return;
    }
    next(error);
  }
};

// Get doctor reviews (public)
export const getDoctorReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if PostgreSQL is connected
    try {
      await sequelize.authenticate();
    } catch (dbError) {
      res.json({
        success: true,
        data: {
          reviews: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0,
          },
        },
      });
      return;
    }

    const doctor = await Doctor.findByPk(id);
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await Rating.findAndCountAll({
      where: { doctorId: doctor.id },
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    // Fetch patient names for reviews
    const reviewsWithNames = await Promise.all(
      rows.map(async (rating) => {
        let patientName = 'Anonymous';
        try {
          const patient = await Patient.findById(rating.patientId);
          if (patient && patient.userId) {
            const user = await User.findById(patient.userId);
            if (user && user.profile) {
              const { firstName, lastName } = user.profile;
              if (firstName || lastName) {
                patientName = `${firstName || ''} ${lastName || ''}`.trim();
              }
            }
          }
        } catch (error) {
          // If patient not found, use anonymous
        }

        return {
          id: rating.id,
          rating: rating.rating,
          comment: rating.comment,
          patientName,
          createdAt: rating.createdAt,
        };
      })
    );

    res.json({
      success: true,
      data: {
        reviews: reviewsWithNames,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          pages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get doctor profile (public)
export const getDoctorProfile = async (
  req: Request,
  res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findByPk(id);

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    // Fetch user name
    let name = 'Dr. ' + doctor.specialization;
    let email = doctor.contact?.email || '';

    try {
      const user = await User.findById(doctor.userId);
      if (user && user.profile) {
        const { firstName, lastName } = user.profile;
        if (firstName || lastName) {
          name = `Dr. ${firstName || ''} ${lastName || ''}`.trim();
        }
        email = user.email || email;
      }
    } catch (error) {
      // If user not found, use default name
    }

    const doctorWithName = {
      ...doctor.toJSON(),
      name,
      email,
    };

    // Add JSON-LD for SEO
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Physician',
      name: name,
      medicalSpecialty: doctor.specialization,
      address: {
        '@type': 'PostalAddress',
        addressLocality: doctor.address.city,
        addressRegion: doctor.address.state,
        postalCode: doctor.address.zipCode,
      },
    };

    res.json({
      success: true,
      data: { doctor: doctorWithName, jsonLd },
    });
  } catch (error) {
    next(error);
  }
};

// Search medicines (public)
export const searchMedicines = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;

    const query: any = {
      isActive: true,
    };

    if (q) {
      query[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { genericName: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (category) {
      query.category = category;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Medicine.findAndCountAll({
      where: query,
      limit: Number(limit),
      offset,
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      data: {
        medicines: rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          pages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get medicine details (public)
export const getMedicineDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findByPk(id);

    if (!medicine) {
      throw new AppError('Medicine not found', 404);
    }

    // Add JSON-LD for SEO
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Drug',
      name: medicine.name,
      genericName: medicine.genericName,
      manufacturer: medicine.manufacturer,
      description: medicine.description,
    };

    res.json({
      success: true,
      data: { medicine, jsonLd },
    });
  } catch (error) {
    next(error);
  }
};

// Get health blogs
export const getHealthBlogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Implement blog model and query
    res.json({
      success: true,
      data: { blogs: [] },
    });
  } catch (error) {
    next(error);
  }
};

// Get blog post
export const getBlogPost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;
    // TODO: Get blog post by slug
    res.json({
      success: true,
      data: { post: null },
    });
  } catch (error) {
    next(error);
  }
};



