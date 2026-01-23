'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Star, User } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';

interface Review {
  id: number;
  rating: number;
  comment?: string;
  patientName: string;
  createdAt: string;
}

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: number | null;
}

const ReviewsModal: React.FC<ReviewsModalProps> = ({
  isOpen,
  onClose,
  doctorId,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReviews = useCallback(async () => {
    if (!doctorId) return;

    setLoading(true);
    try {
      const response = await api.get(`/api/public/doctors/${doctorId}/reviews?page=${page}&limit=10`);
      const data = response.data?.data || {};
      setReviews(data.reviews || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [doctorId, page]);

  useEffect(() => {
    if (isOpen && doctorId) {
      fetchReviews();
    } else {
      setReviews([]);
      setPage(1);
    }
  }, [isOpen, doctorId, page, fetchReviews]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating
            ? 'text-warning-500 fill-warning-500'
            : 'text-secondary-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Doctor Reviews">
      <div className="max-h-[70vh] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading reviews..." />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-600 font-medium">No reviews yet</p>
            <p className="text-sm text-secondary-500 mt-2">
              Be the first to review this doctor
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-secondary-50 rounded-xl p-4 border border-secondary-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-900">
                        {review.patientName}
                      </p>
                      <p className="text-xs text-secondary-500">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {renderStars(review.rating)}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-secondary-700 mt-3 pl-12">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-secondary-200">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-secondary-300 text-sm font-medium text-secondary-700 hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-secondary-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-secondary-300 text-sm font-medium text-secondary-700 hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReviewsModal;
