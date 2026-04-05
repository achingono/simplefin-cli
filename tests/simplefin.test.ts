import axios from 'axios';
import { claimAccessUrl } from '../src/client/simplefin';
import { ErrorCodes } from '../src/errors';

jest.mock('axios');

const mockedPost = axios.post as jest.MockedFunction<typeof axios.post>;

describe('claimAccessUrl validation', () => {
  test('rejects non-base64 tokens', async () => {
    await expect(claimAccessUrl('@@@')).rejects.toMatchObject({ code: ErrorCodes.SETUP_INVALID });
    expect(mockedPost).not.toHaveBeenCalled();
  });

  test('rejects decoded values that are not URLs', async () => {
    const token = Buffer.from('ftp://example.com/path').toString('base64');
    await expect(claimAccessUrl(token)).rejects.toMatchObject({ code: ErrorCodes.SETUP_INVALID });
    expect(mockedPost).not.toHaveBeenCalled();
  });
});
