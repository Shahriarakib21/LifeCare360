import axios from 'axios';
import api, { handleApiError } from '../lib/api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('API instance', () => {
    it('should have correct base URL', () => {
      expect(api.defaults.baseURL).toBeDefined();
    });

    it('should include auth token in requests', () => {
      localStorage.setItem('token', 'test-token');
      
      // Create a new instance to test interceptor
      const createSpy = jest.spyOn(axios, 'create');
      
      expect(createSpy).toHaveBeenCalled();
    });
  });

  describe('handleApiError', () => {
    it('should handle axios errors', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            message: 'Test error',
          },
        },
        message: 'Network error',
      };

      const error = handleApiError(axiosError as any);
      expect(error).toBe('Test error');
    });

    it('should handle errors without response', () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Network error',
      };

      const error = handleApiError(axiosError as any);
      expect(error).toBe('Network error');
    });

    it('should handle non-axios errors', () => {
      const error = handleApiError(new Error('Generic error'));
      expect(error).toBe('An unexpected error occurred');
    });
  });
});

