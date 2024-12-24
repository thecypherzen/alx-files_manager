import Bull from 'bull';
import ImageThumbnail from 'image-thumbnail';
import { writeFile } from 'fs';
import { ObjectId } from 'mongodb';
import { dbUtils } from './shared';

const fileQueue = new Bull('fileQueue');
const userQueue = new Bull('userQueue');

// Queue Events
fileQueue.on('global:active', async (jobId) => {
  const job = await fileQueue.getJob(jobId);
  job.log(`worker job: ${jobId} started.`);
});

userQueue.on('global:active', async (jobId) => {
  const job = await userQueue.getJob(jobId);
  job.log(`worker job: ${jobId} started:`,
    new Date().toISOString());
});

fileQueue.on('global:completed', async (jobId) => {
  const job = await fileQueue.getJob(jobId);
  job.log(`worker job: ${jobId} completed successfully.`);
});

fileQueue.on('global:error', async (jobId, err) => {
  const job = await fileQueue.getJob(jobId);
  job.log(`worker job: ${jobId} failed.Messae: ${err}.`);
});

fileQueue.on('global:failed', async (jobId, err) => {
  const job = await fileQueue.getJob(jobId);
  job.log(`worker job: ${jobId} failed. Message: ${err}`);
});

userQueue.on('global:failed', async (jobId, err) => {
  console.log(`user worker job ${jobId} failed. Message:`,
    err);
});

// File Worker process
fileQueue.process('makeThumbnail', async (job) => {
  // validate job data
  if (!job.data.userId) {
    return new Error('Missing userId');
  }
  if (!job.data.fileId) {
    return new Error('Missing fieldId');
  }
  // fetch file from db and validate
  const [file] = await dbUtils.getItemsByCred(
    {
      _id: new ObjectId(job.data.fileId),
      userId: new ObjectId(job.data.userId),
    },
    'files',
  );
  if (!file) {
    return new Error('File not found');
  }

  // generate thumbnails based on width
  const widths = [500, 250, 100];
  const promises = [];
  for (const width of widths) {
    const generator = (async () => {
      const path = `${file.localPath}_${width}`;
      const thumbnail = await ImageThumbnail(file.localPath, { width });
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

// User Worker Process
userQueue.process(async (job) => {
  if (!job.data.userId) {
    return new Error('Missing userId');
  }
  // get user by id
  const [user] = await dbUtils.getItemsByCred({
    _id: new ObjectId(job.data.userId),
  });
  if (!user) {
    return new Error('User not found');
  }
  // log message
  console.log(`Welcome ${user.email}!`);
  return null;
});
