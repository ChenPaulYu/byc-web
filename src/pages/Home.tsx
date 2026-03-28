import React from 'react';
import LandingScene from '../components/LandingScene';
import { usePageTitle } from '../utils/usePageTitle';

const Home: React.FC = () => {
  usePageTitle();
  return (
    <>
      <LandingScene />
    </>
  );
};

export default Home;