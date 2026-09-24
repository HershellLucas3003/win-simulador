import styled from 'styled-components'

export const Workspace = styled.div`
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 12px;
  height: 100%;
  min-height: 0;
`

export const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const Item = styled.li<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid ${({ theme, $selected }) => ($selected ? theme.colors.accent : 'transparent')};
  background: ${({ $selected }) => ($selected ? '#fffbeb' : 'transparent')};

  &:hover {
    background: ${({ $selected }) => ($selected ? '#fffbeb' : '#f9fafb')};
  }
`

export const ItemTitle = styled.span`
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const ItemMeta = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const HiddenFile = styled.input`
  display: none;
`

export const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

export const SectionTitle = styled.h3`
  margin: 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Grid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns = 2 }) => $columns}, minmax(0, 1fr));
  gap: 12px 16px;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

export const ChanceRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
`

export const Description = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const EmitBar = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid ${({ theme }) => theme.colors.border};
`

export const BurstFields = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-left: auto;

  label {
    width: 110px;
  }
`

export const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  position: sticky;
  bottom: 0;
  padding-top: 8px;
  background: ${({ theme }) => theme.colors.card};
  z-index: ${({ theme }) => theme.layers.sticky};
`
