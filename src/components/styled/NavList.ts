import styled from 'styled-components';

const NavList = styled.ul`
  display: flex;
  justify-content: center;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

export default NavList;