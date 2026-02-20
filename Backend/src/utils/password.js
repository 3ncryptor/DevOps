import bcrypt from 'bcrypt';

const hashPassword = async (password) => {
    return bcrypt.hash(password, 10);
};

const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

export { hashPassword, comparePassword };
