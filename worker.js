import Bull from 'bull';
import ImageThumbnail from 'image-thumbnail';
import { writeFile } from 'fs';
import { ObjectId } from 'mongodb';
import { dbUtils } from './shared';

const fileQueue = new Bull('fileQueue');

// Queue Events
fileQueue.on('global:active', (jobId) => {
  console.log(`worker job: ${jobId} started ...`);
});

fileQueue.on('global:completed', (jobId, res) => {
  console.log('job,', jobId, 'completed.');
  console.log('\tRESULT:', res);
});

fileQueue.on('global:error', (jobId, err) => {
  console.log(`job ${jobId} encountered an error:\n\t`, err);
});

fileQueue.on('global:failed', (jobId, err) => {
  console.log(`job ${jobId} failed due to: ${err}`,
    err);
});

// Worker process
fileQueue.process('makeThumbnail', async (job) => {
  console.log(`processing job ${job.id}`);
  if (!job.data.userId) {
    console.log('no userId error');
    return new Error('Missing userId');
  }
  if (!job.data.fileId) {
    console.log('missing fileId error');
    return new Error('Missing fieldId');
  }
  console.log('fetching file...by data:\n\t', job.data);
  const [file] = await dbUtils.getItemsByCred(
    {
      _id: new ObjectId(job.data.fileId),
      userId: new ObjectId(job.data.userId),
    },
    'files',
  );
  if (!file) {
    console.log('no file error');
    return new Error('File not found');
  }
  console.log('no error...proceeding to generate thumbnails');
  const widths = [500, 250, 100];
  const promises = [];
  for (const width of widths) {
    const generator = (async () => {
      const path = `${file.localPath}_${width}`;
      console.log(`\tgenerating thumbnail for width: ${width}`);
      const thumbnail = await ImageThumbnail(file.localPath, { width });
      console.log('writing thumbnail: ', path);
      await writeFile(path, thumbnail, (err) => {
        if (err) {
          return err;
        }
        return null;
      });
    })();
    promises.push(generator);
  }
  await Promise.all(promises);
  return null;
});
