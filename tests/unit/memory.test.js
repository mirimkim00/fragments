const {
  writeFragment,
  writeFragmentData,
  readFragment,
  readFragmentData,
  listFragments,
  deleteFragment,
} = require('../../src/model/data/memory');

describe('test In-Memory DB', () => {
  test('writeFragment() returns nothing', async () => {
    const result = await writeFragment({
      ownerId: 'sampleOwnerId',
      id: 'sampleID',
      fragment: 'sample fragment',
    });
    expect(result).toBe(undefined);
  });

  test("writeFragmentData() doesn't return data", async () => {
    const result = await writeFragmentData('a', 'b', '');
    expect(result).toBe(undefined);
  });

  test('write fragment and read it - readFragment', async () => {
    await writeFragment({ ownerId: 'test1', id: '1', fragment: 'test fragment 1' });
    const result = await readFragment('test1', '1');
    expect(result).toEqual({ ownerId: 'test1', id: '1', fragment: 'test fragment 1' });
  });

  test("ownerId and fragment id don't exist", async () => {
    expect(() => readFragment('test2', '2').rejects.toThrow());
  });

  test('write fragment and read it - readFragmentData', async () => {
    await writeFragmentData('test3', '3', 'test fragment 3');
    const result = await readFragmentData('test3', '3');
    expect(result).toEqual('test fragment 3');
  });

  test("fragment id doesn't exist", async () => {
    await writeFragment({ ownerId: 'test4', id: '4', fragment: 'test fragment 4' });
    expect(() => readFragmentData('test4', '444').rejects.toThrow());
  });

  test('return array of fragment ids - same ownerId', async () => {
    await writeFragment({ ownerId: 'test5', id: '5', fragment: 'testing fragment 5' });
    await writeFragment({ ownerId: 'test5', id: '6', fragment: 'testing fragment 6' });

    const idArray = await listFragments('test5');
    expect(Array.isArray(idArray)).toBe(true);
    expect(idArray).toEqual(['5', '6']);
  });

  test('return array of expanded fragments - same ownerId', async () => {
    await writeFragment({ ownerId: 'test6', id: '7', fragment: 'testing fragment 7' });
    await writeFragment({ ownerId: 'test6', id: '8', fragment: 'testing fragment 8' });

    const fragmentsArray = await listFragments('test6', true);
    expect(Array.isArray(fragmentsArray)).toBe(true);
    expect(fragmentsArray).toEqual([
      { ownerId: 'test6', id: '7', fragment: 'testing fragment 7' },
      { ownerId: 'test6', id: '8', fragment: 'testing fragment 8' },
    ]);
  });

  test('removes fragment data and metadata from database', async () => {
    await writeFragment({ ownerId: 'test9', id: '9', fragment: 'testing fragment 9' });
    await writeFragmentData('test9', '9', 'testing fragment 9');

    const resultMetaData = await readFragment('test9', '9');
    expect(resultMetaData).toEqual({ ownerId: 'test9', id: '9', fragment: 'testing fragment 9' });
    const resultData = await readFragmentData('test9', '9');
    expect(resultData).toEqual('testing fragment 9');

    await deleteFragment('test9', '9');

    expect(() => readFragmentData('test9', '9').rejects.toThrow());
    expect(() => readFragment('test9', '9').rejects.toThrow());
  });
});
