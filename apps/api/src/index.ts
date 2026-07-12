import 'dotenv/config';
import app from './app';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.listen(PORT, () => {
  console.warn(`API server running on port ${PORT} [${process.env.NODE_ENV}]`);
});
