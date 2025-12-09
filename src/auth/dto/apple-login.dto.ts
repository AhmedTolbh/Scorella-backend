export class AppleLoginDto {
  appleId: string;
  email?: string;
  identityToken?: string; // Ideally used for server-side validation
  ageBucket?: string; // Passed from client after Age Gate
}
