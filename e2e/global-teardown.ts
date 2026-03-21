async function globalTeardown(): Promise<void> {
  console.log('[global-teardown] Tests complete');
  // The test database is left in place for debugging.
  // It gets truncated on the next test run via global-setup.
}

export default globalTeardown;
