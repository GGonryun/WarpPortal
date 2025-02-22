import { procedure } from '../trpc';
import { withAuth } from '../middleware/with-auth';

const privateProcedure = procedure.use(withAuth);

export default privateProcedure;
