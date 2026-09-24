import styled from 'styled-components'

export const List = styled.div`
  display: flex;
  gap: 2px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 0 8px;
  background: ${({ theme }) => theme.colors.card};
  border-radius: 8px 8px 0 0;
`

export const Tab = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.textMuted)};
  border-bottom: 2px solid ${({ theme, $active }) => ($active ? theme.colors.accent : 'transparent')};
  margin-bottom: -1px;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`
