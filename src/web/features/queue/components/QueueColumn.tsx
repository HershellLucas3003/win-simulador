import * as S from '../styles'
import { EquipmentQueue } from './EquipmentQueue'
import { TransitVehicles } from './TransitVehicles'

export function QueueColumn() {
  return (
    <S.Column>
      <EquipmentQueue />
      <TransitVehicles />
    </S.Column>
  )
}
