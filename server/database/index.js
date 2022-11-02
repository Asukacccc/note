import { createPool } from 'mysql'

export default createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'aaaalice',
    database: 'note'
})