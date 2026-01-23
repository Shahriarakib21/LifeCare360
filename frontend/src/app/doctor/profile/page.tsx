'use client';

import React, { useState, useEffect } from 'react';
import { User, Save, Upload, X, MapPin, Phone, Mail, Globe, GraduationCap, Briefcase, Award, FileText } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Dermatology',
  'Orthopedics',
  'Gynecology',
  'Psychiatry',
  'Oncology',
  'Endocrinology',
  'Gastroenterology',
  'Pulmonology',
  'Urology',
  'Ophthalmology',
  'ENT (Ear, Nose, Throat)',
  'Rheumatology',
  'Anesthesiology',
  'Emergency Medicine',
  'Family Medicine',
  'Internal Medicine',
  'Other',
];

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Mandarin',
  'Hindi',
  'Arabic',
  'Portuguese',
  'Russian',
  'Japanese',
  'Italian',
  'Korean',
  'Other',
];

export default function DoctorProfilePage() {
  const router = useRouter();
  const { user: storeUser, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [specialization, setSpecialization] = useState('General Medicine');
  const [qualifications, setQualifications] = useState<string[]>(['']);
  const [experience, setExperience] = useState<number>(0);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [hospital, setHospital] = useState('');
  const [clinic, setClinic] = useState('');

  // Address fields
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('US');

  // Contact fields
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  // Profile image
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !storeUser) {
      router.push('/auth/login');
      return;
    }

    if (storeUser.role !== 'doctor') {
      router.push('/unauthorized');
      return;
    }

    fetchProfile();
  }, [isAuthenticated, storeUser, router]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/doctors/profile');
      const doctor = response.data.data.doctor;
      const userData = response.data.data.user;

      if (doctor) {
        setSpecialization(doctor.specialization || 'General Medicine');
        setQualifications(doctor.qualifications && doctor.qualifications.length > 0 ? doctor.qualifications : ['']);
        setExperience(doctor.experience || 0);
        setLicenseNumber(doctor.licenseNumber || '');
        setLicenseExpiry(doctor.licenseExpiry ? new Date(doctor.licenseExpiry).toISOString().split('T')[0] : '');
        setBio(doctor.bio || '');
        setLanguages(doctor.languages && doctor.languages.length > 0 ? doctor.languages : ['English']);
        setHospital(doctor.hospital || '');
        setClinic(doctor.clinic || '');

        if (doctor.address) {
          setStreet(doctor.address.street || '');
          setCity(doctor.address.city || '');
          setState(doctor.address.state || '');
          setZipCode(doctor.address.zipCode || '');
          setCountry(doctor.address.country || 'US');
        }

        if (doctor.contact) {
          setPhone(doctor.contact.phone || userData?.profile?.phone || '');
          setWebsite(doctor.contact.website || '');
        }

        if (doctor.profileImage) {
          setProfileImage(doctor.profileImage);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Don't show error if profile doesn't exist yet (new doctor)
      if ((error as any)?.response?.status !== 404) {
        toast.error(handleApiError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddQualification = () => {
    setQualifications([...qualifications, '']);
  };

  const handleRemoveQualification = (index: number) => {
    if (qualifications.length > 1) {
      setQualifications(qualifications.filter((_, i) => i !== index));
    }
  };

  const handleQualificationChange = (index: number, value: string) => {
    const updated = [...qualifications];
    updated[index] = value;
    setQualifications(updated);
  };

  const handleLanguageToggle = (language: string) => {
    if (languages.includes(language)) {
      if (languages.length > 1) {
        setLanguages(languages.filter(l => l !== language));
      } else {
        toast.error('At least one language is required');
      }
    } else {
      setLanguages([...languages, language]);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!specialization) {
      toast.error('Please select a specialization');
      return;
    }

    if (!licenseNumber) {
      toast.error('Please enter your license number');
      return;
    }

    if (!licenseExpiry) {
      toast.error('Please enter license expiry date');
      return;
    }

    if (!street || !city || !state || !zipCode) {
      toast.error('Please complete your address');
      return;
    }

    if (!phone) {
      toast.error('Please enter your phone number');
      return;
    }

    setSaving(true);
    try {
      const validQualifications = qualifications.filter(q => q.trim() !== '');

      await api.put('/api/doctors/profile', {
        specialization,
        qualifications: validQualifications,
        experience,
        licenseNumber,
        licenseExpiry: new Date(licenseExpiry).toISOString(),
        bio,
        languages,
        hospital: hospital || null,
        clinic: clinic || null,
        address: {
          street,
          city,
          state,
          zipCode,
          country,
        },
        contact: {
          phone,
          email: storeUser?.email || '',
          website: website || null,
        },
      });

      toast.success('Profile updated successfully!');
      // Refresh the page to show updated data
      fetchProfile();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Please upload a JPG or PNG image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size too large. Maximum size is 5MB.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await api.put('/api/doctors/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.data?.doctor?.profileImage) {
        setProfileImage(response.data.data.doctor.profileImage);
        setImagePreview(null);
        toast.success('Profile image uploaded successfully!');
      }
    } catch (error) {
      toast.error(handleApiError(error));
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto pb-24">
        <div className="flex items-center space-x-3 mb-8">
          <User className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-secondary-900">Update Profile</h1>
        </div>

        <p className="text-secondary-600 mb-8">
          Complete your profile information. This will be visible to patients when they search for doctors and book appointments.
        </p>

        {/* Profile Image */}
        <Card padding="lg" className="mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-secondary-900">Profile Photo</h2>
          </div>

          <div className="flex items-center space-x-6">
            <div className="relative">
              {imagePreview || profileImage ? (
                <div className="relative">
                  <img
                    src={imagePreview || (profileImage?.startsWith('http') ? profileImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${profileImage}`)}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary-200"
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setProfileImage(null);
                    }}
                    className="absolute top-0 right-0 w-6 h-6 bg-error-500 text-white rounded-full flex items-center justify-center hover:bg-error-600"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-secondary-200 flex items-center justify-center border-4 border-secondary-300">
                  <User className="w-16 h-16 text-secondary-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block mb-2">
                <span className="sr-only">Upload profile image</span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="profile-image-upload"
                  disabled={uploadingImage}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => document.getElementById('profile-image-upload')?.click()}
                  disabled={uploadingImage}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingImage ? 'Uploading...' : profileImage ? 'Change Image' : 'Upload Image'}
                </Button>
              </label>
              <p className="text-sm text-secondary-600 mt-2">
                Upload a professional photo. JPG or PNG, max 5MB.
              </p>
            </div>
          </div>
        </Card>

        {/* Basic Information */}
        <Card padding="lg" className="mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Briefcase className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-secondary-900">Basic Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="specialization" className="label">
                Specialization *
              </label>
              <select
                id="specialization"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="input"
                required
              >
                {SPECIALIZATIONS.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="experience" className="label">
                Years of Experience *
              </label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={experience}
                onChange={(e) => setExperience(Number.parseInt(e.target.value) || 0)}
                placeholder="e.g., 10"
                required
              />
            </div>

            <div>
              <label className="label mb-2">Qualifications *</label>
              <div className="space-y-2">
                {qualifications.map((qual, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={qual}
                      onChange={(e) => handleQualificationChange(index, e.target.value)}
                      placeholder="e.g., MD, MBBS, PhD"
                      className="flex-1"
                    />
                    {qualifications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQualification(index)}
                        className="text-error-600 hover:text-error-700 p-2"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddQualification}
                >
                  <Award className="w-4 h-4 mr-1" />
                  Add Qualification
                </Button>
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="label">
                Bio / About
              </label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell patients about your background, expertise, and approach to care..."
                rows={4}
              />
              <p className="text-sm text-secondary-600 mt-2">
                This will be displayed on your profile page for patients to see.
              </p>
            </div>
          </div>
        </Card>

        {/* License Information */}
        <Card padding="lg" className="mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-secondary-900">License Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="licenseNumber" className="label">
                License Number *
              </label>
              <Input
                id="licenseNumber"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Enter your medical license number"
                required
              />
            </div>

            <div>
              <label htmlFor="licenseExpiry" className="label">
                License Expiry Date *
              </label>
              <Input
                id="licenseExpiry"
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                required
              />
            </div>
          </div>
        </Card>

        {/* Practice Information */}
        <Card padding="lg" className="mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <MapPin className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-secondary-900">Practice Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="hospital" className="label">
                Hospital / Institution
              </label>
              <Input
                id="hospital"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                placeholder="e.g., City General Hospital"
              />
            </div>

            <div>
              <label htmlFor="clinic" className="label">
                Clinic Name
              </label>
              <Input
                id="clinic"
                value={clinic}
                onChange={(e) => setClinic(e.target.value)}
                placeholder="e.g., Downtown Medical Clinic"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="street" className="label">
                  Street Address *
                </label>
                <Input
                  id="street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div>
                <label htmlFor="city" className="label">
                  City *
                </label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New York"
                  required
                />
              </div>

              <div>
                <label htmlFor="state" className="label">
                  State / Province *
                </label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="NY"
                  required
                />
              </div>

              <div>
                <label htmlFor="zipCode" className="label">
                  ZIP / Postal Code *
                </label>
                <Input
                  id="zipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="10001"
                  required
                />
              </div>

              <div>
                <label htmlFor="country" className="label">
                  Country *
                </label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="US"
                  required
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card padding="lg" className="mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Phone className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-secondary-900">Contact Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="label">
                Phone Number *
              </label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={storeUser?.email || ''}
                disabled
                className="bg-secondary-50"
              />
              <p className="text-sm text-secondary-600 mt-1">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            <div>
              <label htmlFor="website" className="label">
                Website
              </label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        </Card>

        {/* Languages */}
        <Card padding="lg" className="mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Globe className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-secondary-900">Languages Spoken</h2>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-secondary-600 mb-4">
              Select all languages you can communicate in with patients.
            </p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => handleLanguageToggle(language)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${languages.includes(language)
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                    }`}
                >
                  {language}
                </button>
              ))}
            </div>
            {languages.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-secondary-600 mb-2">Selected languages:</p>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <Badge key={lang} variant="primary" size="sm">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="secondary"
            onClick={() => router.push('/doctor/dashboard')}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saving}>
            <Save className="w-5 h-5 mr-2" />
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
