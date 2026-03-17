const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Item = require('./models/Item');

let io;

const conversationRoom = (conversationId) => `conversation:${conversationId}`;
const userRoom = (userId) => `user:${userId}`;

const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? ['https://your-frontend-domain.com']
        : ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:8081'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!rawToken) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication failed'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(userRoom(socket.user._id.toString()));

    socket.on('conversation:join', async ({ conversationId }) => {
      if (!conversationId) {
        return;
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        'participants.user': socket.user._id,
        isArchived: false,
      }).select('_id');

      if (conversation) {
        socket.join(conversationRoom(conversationId));
      }
    });

    socket.on('conversation:leave', ({ conversationId }) => {
      if (!conversationId) {
        return;
      }

      socket.leave(conversationRoom(conversationId));
    });
  });

  return io;
};

const getIO = () => io;

const buildPopulatedItem = async (itemId) => {
  const item = await Item.findById(itemId)
    .populate('postedBy', 'name email avatar')
    .populate('claimedBy', 'name email avatar');

  return item;
};

const emitConversationUpdate = async (conversationId, type) => {
  if (!io) {
    return;
  }

  const conversation = await Conversation.findById(conversationId)
    .populate('itemId', 'title images type reward')
    .populate('participants.user', 'name avatar email')
    .populate('messages.sender', 'name avatar');

  if (!conversation) {
    return;
  }

  const payload = {
    type,
    conversation,
  };

  io.to(conversationRoom(conversation._id.toString())).emit('conversation:updated', payload);

  conversation.participants.forEach((participant) => {
    io.to(userRoom(participant.user._id.toString())).emit('conversation:updated', payload);
  });
};

const emitItemUpdate = async (itemId, type) => {
  if (!io) {
    return;
  }

  const item = await buildPopulatedItem(itemId);

  if (!item) {
    return;
  }

  const payload = {
    type,
    item,
  };

  io.emit('item:updated', payload);
};

module.exports = {
  initSocketServer,
  getIO,
  emitConversationUpdate,
  emitItemUpdate,
};
