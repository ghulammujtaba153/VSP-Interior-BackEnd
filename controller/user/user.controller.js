import db from '../../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../service/mailService.js';

const { User, Role, Permission, Resource, Audit, EmployeeTimeSheet, EmployeeLeave } = db;


export const createUser = async (req, res) => {
    try {
      const { name, email, password, roleId, userId, salary } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
          return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Generate a temporary random password if none is provided (common for invites)
      const tempPassword = password || Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const user = await User.create({ 
        name, 
        email, 
        password: hashedPassword, 
        roleId, 
        salary: salary || null 
      });
  
      // Generate invite/reset token expiring in 1 hour to match the email text
      const token = jwt.sign({ userId: user.id, purpose: 'invite' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      // Send invitation / password setup email
      const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
      const emailHTML = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
          <p>Hello ${name},</p>
          <p>You have been invited to join the <strong>VSP Admin Panel</strong>.</p>
          <p>Your account has been successfully created. Please click the button below to set your password and access your account:</p>
          <p style="margin-top: 20px; margin-bottom: 20px;">
            <a href="${resetLink}" target="_blank" style="display:inline-block;padding:12px 24px;color:#fff;background-color:#007BFF;text-decoration:none;border-radius:4px;font-weight:bold;">Set Your Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
          <p><em>This link is secure and will expire in 1 hour.</em></p>
          <p>If you did not expect this invitation, you can safely ignore this email.</p>
        </div>
      `;
  
      await sendEmail(email, 'Invitation to Join VSP Admin Panel', emailHTML);

      // Audit log: Record the inviter's ID if provided, otherwise default to the new user's ID
      await Audit.create({ 
          userId: userId || user.id, 
          action: 'create', 
          tableName: 'users', 
          newData: user.get() 
      });
  
      res.status(201).json({ user, message: 'User invited and email sent successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
};


export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '2d' });
        await Audit.create({ userId: user.id, action: 'login', tableName: 'users'});
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getUserByToken = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId, {
            include: [
            {
                model: Role,
                include: [
                    {
                        model: Permission,
                        include: [
                            {
                                model: Resource,
                            }
                        ]
                    }
                ]
            }
        ]});

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        res.status(200).json(user);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getUsers = async (req, res) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'DESC' } = req.query;
    try {
        const offset = (page - 1) * limit;
        
        const { count, rows: users } = await User.findAndCountAll({
            include: [
                {
                    model: Role,
                }
            ],
            attributes: {
                exclude: ['password']
            },
            offset: parseInt(offset),
            limit: parseInt(limit),
            order: [[sortBy, order.toUpperCase()]]
        });
        res.status(200).json({ users, total: count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role, roleId, salary } = req.body;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.name = name;
        user.email = email;
        user.salary = salary || null;
        
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }
        
        // Handle role - if role name is provided, find the role ID
        if (role && !roleId) {
            const roleRecord = await Role.findOne({ where: { name: role } });
            if (roleRecord) {
                user.roleId = roleRecord.id;
            }
        } else if (roleId) {
            user.roleId = roleId;
        }

        await user.save();
        await Audit.create({ userId: user.id, action: 'update', tableName: 'users', oldData: user.get(), newData: req.body });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, userId } = req.body;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.status = status;
        await user.save();
        await Audit.create({ userId: userId, action: 'update', tableName: 'users', oldData: user.get(), newData: req.body });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const resetUserPassword = async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
  
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }
  
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await user.save();
  
      res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
      console.error(error);
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({ error: 'Reset token has expired' });
      }
      res.status(500).json({ error: 'Invalid or expired token' });
    }
  };

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        await User.destroy({ where: { id } });
        await Audit.create({ userId: req.body.userId, action: 'delete', tableName: 'users', oldData: user.get() });
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}




export const getStaffProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Role,
          include: [
            {
              model: Permission,
              include: [{ model: Resource }],
            },
          ],
        },
        {
          model: EmployeeTimeSheet,
          as: "EmployeeTimeSheets",
          attributes: [
            "id",
            "date",
            "startTime",
            "endTime",
            "breakTime",
            "overWork",
            "status",
            "createdAt",
            "updatedAt",
          ],
        },
        {
          model: EmployeeLeave,
          as: "EmployeeLeaves",
          attributes: [
            "id",
            "leaveType",
            "startDate",
            "endDate",
            "status",
            "reason",
            "createdAt",
            "updatedAt",
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching staff profile:", error);
    res.status(500).json({ error: error.message });
  }
  
};
