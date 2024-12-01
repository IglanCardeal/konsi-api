import { IsArray, ArrayNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProcessBenefitsByDocumentDTO {
  @IsArray()
  @ArrayNotEmpty()
  @Transform(({ value }) => value.map((doc: string) => doc.replace(/\D/g, '')))
  @Matches(/^\d{11}$/, {
    each: true,
    message: 'Each document must have exactly 11 digits',
  })
  documents: string[];
}
