const Validator = require('validatorjs');
const moment = require('moment');

const Util = require('../../common/utils/util');
const SchoolOwner = require('../model/SchoolOwner');
const School = require('../model/School');
const { isValidObjectId } = require('mongoose');
const ArchiveSchool = require('../model/ArchiveSchool');

class SchoolController {
  async createSchool(req, res) {
    try {
      const rules = {
        email: 'required|email',
        name: 'required|string',
        category: 'required|string',
        type: 'required|string',
        phone: 'required|string',
        address: 'required|string',
        country: 'required|string',
        state: 'required|string',
        city: 'required|string',
        lga: 'required|string',
        website: 'string|url',
        logo: 'required|string',
        banner: 'required|string',
        admissionRequirements: 'required|array',
        curriculums: 'required|array',
        programsOffered: 'required|array',
        scholarships: 'required|array',
        awards: 'required|array',
        facilityImages: 'required|array',
        accountNumber: 'required|string',
        accountName: 'required|string',
        bankName: 'required|string',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Errors',
          errors: validation.errors.all(),
        });
      }

      const {
        email,
        name,
        category,
        type,
        phone,
        address,
        country,
        state,
        city,
        lga,
        website,
        logo,
        banner,
        admissionRequirements,
        curriculums,
        programsOffered,
        scholarships,
        awards,
        facilityImages,
        accountNumber,
        accountName,
        bankName,
      } = req.body;
      const { _id } = req.schoolOwner;

      const emailExist = await School.findOne({ email });
      if (emailExist && emailExist !== null) {
        return res.status(400).json({
          status: 'failed',
          message: `School with ${email} already exists`,
        });
      }

      const school = new School({
        schoolOwner: _id,
        email,
        name,
        category,
        type,
        phone,
        address,
        country,
        state,
        city,
        lga,
        website,
        logo,
        banner,
        admissionRequirements,
        curriculums,
        programsOffered,
        scholarships,
        awards,
        facilityImages,
        accountNumber,
        accountName,
        bankName,
      });

      await school.save();

      return res.status(201).json({
        status: 'success',
        message: 'School successfully created',
        data: {
          school,
        },
      });
    } catch (error) {
      console.log('Create School Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to create school',
      });
    }
  }

  // Fetch schools
  async getSchools(req, res) {
    try {
      const { _id } = req.schoolOwner;
      const schools = await School.find({ schoolOwner: _id });

      if (schools.length === 0) {
        return res.status(404).json({
          status: 'failed',
          message: 'No schools found',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Schools retrieved',
        data: {
          schools,
        },
      });
    } catch (error) {
      console.log('Fetch Schools Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to fetch schools',
      });
    }
  }

  // Fetch school
  async getSchool(req, res) {
    try {
      const { _id } = req.schoolOwner;
      let { schoolId } = req.params;
      if (!isValidObjectId(schoolId)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid school ID',
        });
      }
      const school = await School.findOne({ schoolOwner: _id, _id: schoolId });
      if (!school) {
        return res.status(404).json({
          status: 'failed',
          message: 'School not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'School retrieved',
        data: {
          school,
        },
      });
    } catch (error) {
      console.log('Fetch School Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to fetch school',
      });
    }
  }

  // Update school
  async updateSchool(req, res) {
    try {
      const { _id } = req.schoolOwner;
      let { schoolId } = req.params;
      if (!isValidObjectId(schoolId)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid school ID',
        });
      }
      const school = await School.findOneAndUpdate(
        { _id: schoolId, schoolOwner: _id },
        req.body,
        { new: true, runValidators: true },
      );

      if (!school) {
        return res.status(404).json({
          status: 'failed',
          message: 'School not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'School Successfully Updated',
        data: {
          school,
        },
      });
    } catch (error) {
      console.log('Fetch School Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to fetch school',
      });
    }
  }

  // Update school
  async deleteSchool(req, res) {
    try {
      const { _id } = req.schoolOwner;
      let { schoolId } = req.params;
      if (!isValidObjectId(schoolId)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid school ID',
        });
      }

      const school = await School.findOne({_id: schoolId, schoolOwner: _id})
      if (!school) {
        return res.status(400).json({
          status: 'failed',
          message: 'School not found',
        });
      }

      // Create a copy of the school document to be archived
      const archivedSchool = new ArchiveSchool(school.toObject());

      // Save the archived school to the archive collection
      await archivedSchool.save();

      await School.findOneAndDelete({ _id: schoolId, schoolOwner: _id });

      return res.status(200).json({
        status: 'success',
        message: 'School Successfully Deleted',
      });
    } catch (error) {
      console.log('Fetch School Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to fetch school',
      });
    }
  }
}

module.exports = new SchoolController();
