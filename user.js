import { isEmail } from 'validator'
import { hash } from 'bcrypt'

const SALT_ROUNDS = 10

class User {
    constructor(email, password) {
        this.email = email
        this.password = password
        this.api_counter = 0
    }

    static async create(email, password) {

        if (email == null || password == null) {
            throw new Error("Email and password are required")
        }

        if (!User.isValidEmail(email)) {
            throw new Error("Email is invalid")
        }

        // TODO: Check if user email already registered

        const hashedPassword = await User.hashPassword(password)
        return new User(email, hashedPassword)
    }

    static async hashPassword(password) {
        return await hash(password, SALT_ROUNDS)
    }

    static isValidEmail(email) {
        return isEmail(email)
    }
}

export default User
