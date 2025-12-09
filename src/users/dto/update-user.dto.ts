export class UpdateUserDto {
  username?: string;
  bio?: string;
  avatarUrl?: string; // We will use the Presigned URL flow for avatar upload too, eventually.
}
