export default function (seconds) {
    const target = new Date(Number(seconds))
    const current = new Date()
    const currentYear = current.getFullYear()
    const targetYear = target.getFullYear()
    const currentMonth = current.getMonth() + 1
    const targetMonth = target.getMonth() + 1
    const currentDate = current.getDate()
    const targetDate = target.getDate()
    let tempDate = ''

    if (currentYear - targetYear > 0) {
        tempDate = `${targetYear}.${targetMonth}.${targetDate}`
    } else {
        if (currentMonth !== targetMonth) {
            tempDate = `${currentMonth}.${targetMonth}`
        } else {
            let dateDistance = 0

            if ((dateDistance = (currentDate - targetDate)) > 7) {
                tempDate = `${currentMonth}.${targetMonth}`
            } else {
                switch (dateDistance) {
                    case 0: 
                        tempDate = '' 
                        break
                    case 1: 
                        tempDate = '昨天'
                        break
                    case 2:
                        tempDate = '两天前'
                        break
                    case 3: 
                        tempDate = '三天前'
                        break
                    case 4: 
                        tempDate = '四天前'
                        break
                    case 5: 
                        tempDate = '五天前'
                        break
                    case 6: 
                        tempDate = '六天前'
                        break
                    case 7: 
                        tempDate = '七天前'
                        break
                }
            }
        }
    }
    const hour = target.getHours()
    const minute = target.getMinutes()

    return [tempDate, `${hour < 10 ? '0' + hour : hour}:${minute < 10 ? '0' + minute : minute}`]
}
