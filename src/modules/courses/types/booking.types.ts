export type CourseBooking = {
  id: string;
  courseId: string;
  userId: string;
  createdAt: Date;
};

export type CourseWithBookingCount = {
  id: string;
  name: string;
  sport: string[];
  level: string;
  date: Date;
  timeFrom: string;
  timeTo: string;
  trainers: string[];
  room: string;
  description: string;
  maxParticipants: number;
  isStandingOrder: boolean;
  frequency: string | null;
  weekdays: string[];
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    bookings: number;
  };
};
