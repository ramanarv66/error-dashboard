export interface ErrorLog {
   id: number;
  errorType: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
  date: string;
  time: string;
}
