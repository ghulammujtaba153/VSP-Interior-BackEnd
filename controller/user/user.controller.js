import db from '../../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../service/mailService.js';

const { User, Role, Permission, Resource, Audit, EmployeeTimeSheet, EmployeeLeave } = db;


export const createUser = async (req, res) => {
    try {
      const { name, email, password, roleId } = req.body;


      // Create user
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({ name, email, password: hashedPassword, roleId });
  
      // Generate reset token
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '2d' });
  
      // Send password reset email
      const resetLink = `https://vps-interior-front-end-ten.vercel.app/reset-password?token=${token}`;
      const emailHTML = `
        <p>Hello ${name},</p>
        <p>Your account has been created. Click below to set your password:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>This link expires in 1 hour.</p>
      `;
  
      await sendEmail(email, 'Set Your Password - VSP Admin Panel', emailHTML);

      await Audit.create({ userId: user.id, action: 'create', tableName: 'users', newData: user.get() });
  
      res.status(201).json({ user, message: 'User created and email sent' });
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
    const { page, limit } = req.query;
    try {
        const offset = (page - 1) * limit;
        
        const users = await User.findAll({
            include: [
                {
                    model: Role,
                }
            ],
            attributes: {
                exclude: ['password']
            },
            offset,
            limit
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role, roleId } = req.body;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.name = name;
        user.email = email;
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
