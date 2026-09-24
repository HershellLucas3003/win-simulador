import styled from 'styled-components'

export const Shell = styled.div`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) 260px;
  height: 100vh;
  min-height: 640px;
`

export const Body = styled.main`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 12px;
  padding: 12px 12px 0;
  min-height: 0;
`

export const Workspace = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
`

export const TabContent = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-top: 12px;
`

export const Bottom = styled.div`
  padding: 12px;
  min-height: 0;

  > section {
    height: 100%;
  }
`
