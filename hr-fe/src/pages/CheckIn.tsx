import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, MapPin, Clock, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { attendanceService } from '../services/api';
import type { Attendance } from '../types';
import Button from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { formatTime } from '../lib/utils';

type AttendanceMode = 'check-in' | 'clock-out' | null;

const CheckIn = () => {
  useAuth(); // Used for auth state

  // Check-in state
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState('WFH');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<AttendanceMode>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);

  // Clock-out state
  const [clockOutPhoto, setClockOutPhoto] = useState<File | null>(null);
  const [clockOutPhotoPreview, setClockOutPhotoPreview] = useState<string | null>(null);
  // Clock-out notes - available for future use

  const fileInputRef = useRef<HTMLInputElement>(null);
  const clockOutFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const clockOutVideoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showClockOutCamera, setShowClockOutCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedClockOutPhoto, setCapturedClockOutPhoto] = useState<string | null>(null);

  useEffect(() => {
    loadTodayAttendance();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const loadTodayAttendance = async () => {
    const response = await attendanceService.getTodayAttendance();
    if (response.success && response.data) {
      setTodayAttendance(response.data);
    }
  };

  // Check-in handlers
  const handleTakePhoto = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.error('Error playing video:', err);
            alert('Unable to start video stream. Please try again or use file upload.');
            handleCloseCamera();
          });
        };
      }
      setShowCamera(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Camera access denied. Please allow camera access in your browser settings or use file upload.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert('No camera found. Please use file upload instead.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        alert('Camera is already in use by another application. Please close other apps or use file upload.');
      } else {
        alert(`Unable to access camera: ${err.message || 'Unknown error'}. Please use file upload instead.`);
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        alert('Failed to capture photo. Please try again.');
        return;
      }
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          setPhoto(file);
          setCapturedPhoto(dataUrl);
          setPhotoPreview(dataUrl);
          setShowCamera(false);
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
          }
        } else {
          alert('Failed to capture photo. Please try again.');
        }
      }, 'image/jpeg', 0.9);
    } else {
      alert('Camera not ready. Please wait for video to load or try again.');
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setPhotoPreview(null);
    setPhoto(null);
    handleTakePhoto();
  };

  const handleCloseCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setCapturedPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clock-out handlers
  const handleClockOutTakePhoto = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      if (clockOutVideoRef.current) {
        clockOutVideoRef.current.srcObject = mediaStream;
        clockOutVideoRef.current.onloadedmetadata = () => {
          clockOutVideoRef.current?.play().catch(err => {
            console.error('Error playing video:', err);
            alert('Unable to start video stream. Please try again or use file upload.');
            handleClockOutCloseCamera();
          });
        };
      }
      setShowClockOutCamera(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Camera access denied. Please allow camera access in your browser settings or use file upload.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert('No camera found. Please use file upload instead.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        alert('Camera is already in use by another application. Please close other apps or use file upload.');
      } else {
        alert(`Unable to access camera: ${err.message || 'Unknown error'}. Please use file upload instead.`);
      }
    }
  };

  const captureClockOutPhoto = () => {
    if (clockOutVideoRef.current && clockOutVideoRef.current.readyState >= 2) {
      const canvas = document.createElement('canvas');
      canvas.width = clockOutVideoRef.current.videoWidth;
      canvas.height = clockOutVideoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        alert('Failed to capture photo. Please try again.');
        return;
      }
      ctx.drawImage(clockOutVideoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'clockout-photo.jpg', { type: 'image/jpeg' });
          setClockOutPhoto(file);
          setCapturedClockOutPhoto(dataUrl);
          setClockOutPhotoPreview(dataUrl);
          setShowClockOutCamera(false);
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
          }
        } else {
          alert('Failed to capture photo. Please try again.');
        }
      }, 'image/jpeg', 0.9);
    } else {
      alert('Camera not ready. Please wait for video to load or try again.');
    }
  };

  const retakeClockOutPhoto = () => {
    setCapturedClockOutPhoto(null);
    setClockOutPhotoPreview(null);
    setClockOutPhoto(null);
    handleClockOutTakePhoto();
  };

  const handleClockOutCloseCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowClockOutCamera(false);
  };

  const handleClockOutFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setClockOutPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setClockOutPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClockOutRemovePhoto = () => {
    setClockOutPhoto(null);
    setClockOutPhotoPreview(null);
    setCapturedClockOutPhoto(null);
    if (clockOutFileInputRef.current) {
      clockOutFileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!photo && !capturedPhoto) {
      alert('Please take or upload a photo for check-in');
      return;
    }

    setIsLoading(true);
    try {
      let photoToSend = photo;
      if (!photoToSend && capturedPhoto) {
        const response = await fetch(capturedPhoto);
        const blob = await response.blob();
        photoToSend = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      }

      if (!photoToSend) {
        alert('No photo to submit. Please take or upload a photo first.');
        setIsLoading(false);
        return;
      }

      const apiResponse = await attendanceService.checkIn({
        photo: photoToSend,
        notes: notes ? `${location}: ${notes}` : location,
      });

      if (apiResponse.success) {
        setSuccess('check-in');
        loadTodayAttendance();
        setPhoto(null);
        setPhotoPreview(null);
        setCapturedPhoto(null);
        setNotes('');
      } else {
        alert(apiResponse.error || 'Check-in failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Check-in error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred. Please try again.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!todayAttendance) {
      alert('You need to check in first before clocking out.');
      return;
    }

    if (todayAttendance.checkOutTime) {
      alert('You have already clocked out today.');
      return;
    }

    setIsLoading(true);
    try {
      let photoToSend = clockOutPhoto;
      if (!photoToSend && capturedClockOutPhoto) {
        const response = await fetch(capturedClockOutPhoto);
        const blob = await response.blob();
        photoToSend = new File([blob], 'clockout-photo.jpg', { type: 'image/jpeg' });
      }

      const apiResponse = await attendanceService.clockOut(todayAttendance.id, photoToSend || undefined);

      if (apiResponse.success) {
        // Refresh attendance data to get total working hours
        await loadTodayAttendance();
        setSuccess('clock-out');
        setClockOutPhoto(null);
        setClockOutPhotoPreview(null);
        setCapturedClockOutPhoto(null);
      } else {
        alert(apiResponse.error || 'Clock out failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Clock out error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred. Please try again.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-brown-900 mb-2">
              {success === 'check-in' ? 'Check-in Successful!' : 'Clock Out Successful!'}
            </h2>
            <p className="text-brown-500 mb-6">
              {success === 'check-in'
                ? `You have successfully checked in at ${formatTime(new Date())}`
                : `You have successfully clocked out at ${formatTime(new Date())}`
              }
            </p>
            {success === 'clock-out' && todayAttendance && todayAttendance.totalWorkingHours && (
              <div className="bg-brown-100 rounded-lg p-4 mb-6">
                <p className="text-sm text-brown-500 mb-1">Total Working Hours</p>
                <p className="text-3xl font-bold text-brown-900">{todayAttendance.totalWorkingHours}</p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setSuccess(null)}>
                Back to Attendance
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user can clock out (has checked in but not yet clocked out)
  const canClockOut = todayAttendance && !todayAttendance.checkOutTime;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-900">Attendance</h1>
        <p className="text-brown-500">Record your attendance for today</p>
      </div>

      {/* Today's Status - Checked In */}
      {todayAttendance && !canClockOut && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Clock size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">Checked in today</p>
                <p className="text-sm text-green-600">Check-in: {formatTime(todayAttendance.checkInTime)}</p>
                {todayAttendance.checkOutTime && (
                  <p className="text-sm text-green-600">Check-out: {formatTime(todayAttendance.checkOutTime)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Status - Not Checked In */}
      {todayAttendance && canClockOut && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-yellow-800">Checked in - Ready to clock out</p>
                <p className="text-sm text-yellow-600">Check-in time: {formatTime(todayAttendance.checkInTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Check-in Section */}
      {!canClockOut && (
        <Card>
          <CardHeader>
            <CardTitle>Check In</CardTitle>
            <CardDescription>Take a photo or upload an image as proof of work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showCamera ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg bg-brown-100"
                />
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" onClick={handleCloseCamera} className="flex-1">
                    <X size={18} className="mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={capturePhoto} className="flex-1">
                    <Camera size={18} className="mr-2" />
                    Capture
                  </Button>
                </div>
              </div>
            ) : photoPreview ? (
              <div className="relative">
                <div className="relative rounded-lg overflow-hidden bg-brown-100">
                  <img
                    src={photoPreview}
                    alt="Check-in photo"
                    className="w-full h-64 object-cover"
                  />
                  <button
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" onClick={retakePhoto} className="flex-1">
                    <Camera size={18} className="mr-2" />
                    Retake
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload size={18} className="mr-2" />
                    Upload Different
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-brown-200 rounded-lg p-8 text-center hover:border-brown-400 transition-colors">
                  <Camera size={48} className="mx-auto text-brown-400 mb-4" />
                  <p className="text-brown-600 mb-4">Take a photo or upload an image</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={handleTakePhoto}>
                      <Camera size={18} className="mr-2" />
                      Take Photo
                    </Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={18} className="mr-2" />
                      Upload
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    capture="environment"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Clock-out Section */}
      {canClockOut && (
        <Card>
          <CardHeader>
            <CardTitle>Clock Out</CardTitle>
            <CardDescription>End your workday by clocking out</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showClockOutCamera ? (
              <div className="relative">
                <video
                  ref={clockOutVideoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg bg-brown-100"
                />
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" onClick={handleClockOutCloseCamera} className="flex-1">
                    <X size={18} className="mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={captureClockOutPhoto} className="flex-1">
                    <Camera size={18} className="mr-2" />
                    Capture
                  </Button>
                </div>
              </div>
            ) : clockOutPhotoPreview ? (
              <div className="relative">
                <div className="relative rounded-lg overflow-hidden bg-brown-100">
                  <img
                    src={clockOutPhotoPreview}
                    alt="Clock-out photo"
                    className="w-full h-64 object-cover"
                  />
                  <button
                    onClick={handleClockOutRemovePhoto}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" onClick={retakeClockOutPhoto} className="flex-1">
                    <Camera size={18} className="mr-2" />
                    Retake
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => clockOutFileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload size={18} className="mr-2" />
                    Upload Different
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-brown-200 rounded-lg p-8 text-center hover:border-brown-400 transition-colors">
                  <Camera size={48} className="mx-auto text-brown-400 mb-4" />
                  <p className="text-brown-600 mb-4">Take a photo or upload an image (optional)</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={handleClockOutTakePhoto}>
                      <Camera size={18} className="mr-2" />
                      Take Photo
                    </Button>
                    <Button variant="outline" onClick={() => clockOutFileInputRef.current?.click()}>
                      <Upload size={18} className="mr-2" />
                      Upload
                    </Button>
                  </div>
                  <input
                    ref={clockOutFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleClockOutFileSelect}
                    className="hidden"
                    capture="environment"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Information for Check-in */}
      {!canClockOut && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brown-700 mb-2">
                Work Location
              </label>
              <div className="relative">
                <MapPin size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={!!todayAttendance}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-brown-200 focus:outline-none focus:ring-2 focus:ring-brown-400 bg-white disabled:bg-gray-100"
                >
                  <option value="WFH">Work From Home</option>
                  <option value="Office">Office</option>
                  <option value="Client Site">Client Site</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brown-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={!!todayAttendance}
                className="w-full px-4 py-3 rounded-lg border border-brown-200 focus:outline-none focus:ring-2 focus:ring-brown-400 resize-none disabled:bg-gray-100"
                placeholder="Any notes about your work today..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit / Clock Out Buttons */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => window.location.href = '/dashboard'}
        >
          Cancel
        </Button>

        {!canClockOut ? (
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!!todayAttendance || isLoading}
            isLoading={isLoading}
          >
            <Clock size={18} className="mr-2" />
            {todayAttendance ? 'Already Checked In' : 'Check In Now'}
          </Button>
        ) : (
          <Button
            className="flex-1"
            onClick={handleClockOut}
            isLoading={isLoading}
          >
            <LogOut size={18} className="mr-2" />
            Clock Out Now
          </Button>
        )}
      </div>
    </div>
  );
};

export default CheckIn;
