declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      OPENAI_API_KEY: string;
    }
  }
}

const REQUIRED_ENV_NAMES = ['PORT', 'OPENAI_API_KEY'];
const SECRET_ENV_NAMES = ['OPENAI_API_KEY'];
const ALL_ENV_NAMES = REQUIRED_ENV_NAMES.concat(['NODE_ENV']);

function checkEnvVar() {
  const missingEnvNames = [];

  for (const key of REQUIRED_ENV_NAMES) {
    if (process.env[key] == undefined || process.env[key] === '') {
      missingEnvNames.push(key);
    }
  }

  if (missingEnvNames.length > 0) {
    throw new Error(
      `Missing environment variables:\n\n- ${missingEnvNames.join('\n- ')}\n`,
    );
  }

  console.log('Environment variables:\n');

  for (const key of ALL_ENV_NAMES) {
    const value = SECRET_ENV_NAMES.includes(key)
      ? '<HIDDEN>'
      : process.env[key];

    console.log(`${key}=${value}`);
  }

  console.log('\n');
}

checkEnvVar();
