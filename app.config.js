module.exports = ({ config }) => {
  if (process.env.AURA_LOCAL_DEV !== '1') {
    return {
      ...config,
      android: {
        ...config.android,
        googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
      },
    };
  }

  const android = { ...config.android };
  delete android.googleServicesFile;

  return { ...config, android };
};
