import * as S from '../styles'
import { EquipmentIdentityCard } from './EquipmentIdentityCard'
import { ResponseProfileCard } from './ResponseProfileCard'

export function EquipmentPanel() {
  return (
    <S.Layout>
      <ResponseProfileCard />
      <EquipmentIdentityCard />
    </S.Layout>
  )
}
