import db from '../database/index.js'

function searchNote(req, res) {
    let queryStr = 'select tag, brief, title, id, shareDate from note'
    const startTime = req.query.start
    const endTime = req.query.end
    const type = req.query.type
    const content = req.query.content.split(' ')
    const length = req.query.length - 0
    const id = req.query.id - 0
    const isShare = req.query.share

    queryStr += id ? ` where id < ${ id }` : ' where id >= 0'
    queryStr += startTime ? ` and updateTime >= ${ startTime }` : ''
    queryStr += endTime ?  ` and updateTime <= ${ endTime }` : ''

    if (content[0]) queryStr += ` and ( tag like '%${ content[0] }%'`
    if (content.length > 1) {
        for (let i = 1; i < content.length; i ++) {
            queryStr += ` and tag like '%${ content[i] }%'`
        }
    }

    switch(type) {
        case '0':
            if (content[0]) 
                queryStr += ` or title like '%${ content.join(' ') }%' or brief like '%${ content.join(' ') }%' )`
            break
        case '1':
            queryStr += ` or brief like '%${ content.join(' ') }%' ) and title = ''`
            break
        case '2':
            queryStr += ` or title like '%${ content.join(' ') }%' ) and brief = ''`
            break
    }

    if (isShare !== 2) {
        if (isShare === 0) {
            queryStr += ` and shareDate = '0'`
        } else {
            queryStr += ` and shareDate > '0'`
        }
    }

    queryStr += ' order by id desc limit 0, ?'

    db.query(queryStr, length, (err, queryResult) => {
        if (err) return res.cc(err)
        
        res.cc(queryResult, 0)
    })
}

export { searchNote }