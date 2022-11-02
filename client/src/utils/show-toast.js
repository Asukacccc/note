export default function(title = '请求失败', icon = 'none', duration = 1500) {
    uni.showToast({
        title, icon, duration
    })
}