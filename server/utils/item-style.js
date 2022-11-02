export default function (contentStr) {
    function getParentId(floorId, currentId) {
        const parentList = floorList[floorId - 1].list
        let parentId = 0

        for (let i of parentList) {
            const itemId = i.childId

            if (!parentChildRelation[itemId]) continue

            const currentItemIndex = (function () {
                return parentChildRelation[itemId].indexOf(currentId)
            })()

            if (currentItemIndex !== -1) {
                parentId = itemId
                break
            }
        }

        return parentId
    }

    function computedLine(floorId, currentId) {
        let parentId = getParentId(floorId, currentId)
        const parentTop = itemInfo[parentId].top
        const childTop = itemInfo[currentId].top
        const left = floorId * 150
        let styleStr = ''

        if (parentTop === childTop) {
            styleStr += `height: 0.5px;top: ${parentTop + 25}px; transform: translateY(-50%); left: ${left}px; background-color: var(--text)`
        } else {
            const height = Math.abs(parentTop - childTop)
            const parentHigher = parentTop < childTop
            const top = parentHigher ? parentTop + 25 : childTop + 25
            styleStr += `height: ${height}px; top: ${top}px; left: ${left}px; border-left: 1px solid var(--text);`

            if (parentHigher) {
                styleStr += 'border-bottom: 1px solid var(--text); border-bottom-left-radius: 100%'
            }
            else {
                styleStr += 'border-top: 1px solid var(--text); border-top-left-radius: 100%'
            }
        }

        return styleStr
    }

    const [parentChildRelation, floorList, itemInfo] = JSON.parse(contentStr)
    const styleObj = {}

    for (const i in floorList) {
        if (i - 0 === 0) continue

        const floorId = floorList[i].floorId
        const list = floorList[i].list

        for (const k of list) {
            styleObj[k.childId] = computedLine(floorId, k.childId)
        }
    }

    return styleObj
}