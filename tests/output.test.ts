import * as output from '../src/output';

describe('output', () => {
  let consoleSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    exitSpy = jest.spyOn(output, '_exit').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  test('printSuccess outputs ok:true with data', () => {
    output.printSuccess({ message: 'hello' });
    const payload = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(payload).toEqual({ ok: true, message: 'hello' });
  });

  test('printError outputs ok:false and calls exit', () => {
    output.printError('TEST_CODE', 'test message');
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({ ok: false, error: { code: 'TEST_CODE', message: 'test message' } })
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('printSuccess forces ok true even if provided', () => {
    output.printSuccess({ ok: false, message: 'hello' });
    const payload = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(payload).toEqual({ ok: true, message: 'hello' });
  });
});
