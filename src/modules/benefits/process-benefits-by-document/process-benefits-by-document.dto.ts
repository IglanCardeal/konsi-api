import { IsArray, ArrayNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessBenefitsByDocumentDTO {
  @ApiProperty({
    description: 'Array of CPF document numbers',
    example: ['12345678901', '98765432109'],
    isArray: true,
    minItems: 1,
  })
  @IsArray()
  @ArrayNotEmpty()
  @Transform(({ value }) => value.map((doc: string) => doc.replace(/\D/g, '')))
  @Matches(/^\d{11}$/, {
    each: true,
    message: 'Each document must have exactly 11 digits',
  })
  documents: string[];
}

export class ProcessBenefitsByDocumentResponseDTO {
  @ApiProperty({
    description: 'Indicates if the processing was successful',
    example: true,
  })
  success: boolean;
}
