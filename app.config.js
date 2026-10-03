module.exports = ({ config }) => {
  if (process.env.AURA_LOCAL_DEV !== '1') {
    return config;
  }

  const android = { ...config.android };
  delete android.googleServicesFile;

  return { ...config, android };
};
