import { useLocale } from '@/providers/locale-provider'
const Profile = () => {
    const { t } = useLocale()
    return (
        <div>
            <h2>{t('profile.title')}</h2>
            <p>{t('profile.description')}</p>
        </div>
    )
}

export default Profile
