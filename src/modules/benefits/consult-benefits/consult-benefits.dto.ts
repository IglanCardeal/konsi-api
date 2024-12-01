import { Matches, IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class ConsultBenefitsDTO {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.replace(/\D/g, ''))
  @Matches(/^\d{11}$/, {
    each: true,
    message: 'The document must have exactly 11 digits',
  })
  document: string;
}
