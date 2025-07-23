export abstract class BaseEnumConverter<
  TEnum extends Record<string, string | number>,
> {
  constructor(
    private readonly enumObject: TEnum,
    private readonly enumName: string,
  ) {}

  stringToEnum(value: string): TEnum[keyof TEnum] {
    const upperValue = value.toUpperCase();

    // Buscar por key del enum
    for (const [key, enumValue] of Object.entries(this.enumObject)) {
      if (key === upperValue) {
        return enumValue as TEnum[keyof TEnum];
      }
    }

    throw new Error(`Invalid ${this.enumName}: ${value}`);
  }

  enumToString(enumValue: TEnum[keyof TEnum]): string {
    // Buscar por value del enum
    for (const [key, value] of Object.entries(this.enumObject)) {
      if (value === enumValue) {
        return key;
      }
    }

    throw new Error(`Invalid ${this.enumName} enum: ${enumValue}`);
  }
}
