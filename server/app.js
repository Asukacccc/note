import express from 'express'
import cors from 'cors'
import { expressjwt } from 'express-jwt'
import { jwtKey } from './config/index.js'
import note from './router/note.js'
import user from './router/user-info.js'
import image from './router/image.js'
import publish from './router/publish.js'
import tags from './router/tags.js'
import search from './router/search.js'
import path from 'path'
import template from 'express-art-template'
import session from 'express-session'
import connectRedis from 'connect-redis'
import ioredis from 'ioredis'
import redisConfig from './config/redis.js'
import mobile from './router/mobile.js'

const app = express()
const __dirname = path.resolve()
const redisStore = connectRedis(session)
const redisClient = new ioredis({ port: redisConfig.port, host: redisConfig.host, password: redisConfig.password })

app.use(cors())
app.use(express.json(), express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, './public')))

app.use((req, res, next) => {
    res.cc = (err, status = 1) => {
        res.send({
            status,
            message: err instanceof Error ? err.message : err
        })
    }
    next()
})

app.use(session({
    store: new redisStore({ client: redisClient }),
    secret: 'asu huj AJH HSA hua hai ash saw ius hai',
    cookie: {
        maxAge: 1000 * 60 * 60,
        secure: false
    },
    resave: true,
    saveUninitialized: true
}))

app.set('views', path.join(__dirname, './views'))
app.engine('art', template)

app.use(expressjwt({ secret: jwtKey.secret, algorithms: ['HS256'] }).unless({
    path: [/^\/user\/openid/, /^\/share\/get/, /^\/share\/check/, /^\/(?!(share|note|user|tags|search))/]
}))

app.use('/note', note)
app.use('/user', user)
app.use('/image', image)
app.use('/share', publish)
app.use('/tags', tags)
app.use('/search', search)
app.use('/mobile', mobile)

app.use('*', (req, res) => {
    res.render('404.art', { isTimeout: false })
})

app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') return res.cc('Certification fail')
    res.cc(err)
})

app.listen(80, () => console.log('server is running...'))