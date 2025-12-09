export class CreateReportDto {
  reporterId: string;
  reportedUserId?: string;
  videoId?: string;
  reason: string;
  details?: string;
}
