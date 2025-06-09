export interface Book {
  _id: string;
  title: string;
  author: string;
  status: "not-started" | "in-progress" | "completed";
  rating?: number;
  genre?: string;
  notes?: string;
  coverUrl?: string;
  dateAdded: string | Date;
  dateCompleted?: string | Date;
}