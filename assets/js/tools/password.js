const SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*_-+=?",
};

function secureRandom() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] / 4294967296;
}

export function generatePassword(options, randomSource = secureRandom) {
  const length = Number(options?.length);
  if (!Number.isInteger(length) || length < 8 || length > 64) {
    throw new RangeError("密码长度必须是 8–64 位整数。");
  }

  const alphabet = Object.entries(SETS)
    .filter(([key]) => Boolean(options?.[key]))
    .map(([, characters]) => characters)
    .join("");

  if (!alphabet) throw new Error("请至少选择一种字符类型。");

  let password = "";
  for (let index = 0; index < length; index += 1) {
    const random = Math.min(Math.max(Number(randomSource()), 0), 0.999999999999);
    password += alphabet[Math.floor(random * alphabet.length)];
  }
  return password;
}
