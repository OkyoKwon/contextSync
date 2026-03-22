async function cleanEnvTeardown(): Promise<void> {
  console.log('[clean-env-teardown] Tests complete. Docker cleanup handled by npm script.');
}

export default cleanEnvTeardown;
