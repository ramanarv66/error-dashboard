export interface ErrorLog {
  //  id: number;
  // errorType: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  // message: string;
  // date: string;
  // time: string;

   id?: number;
  date: string;
  time: string;
  log_level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
}
