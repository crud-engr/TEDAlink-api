const Validator = require('validatorjs');
const moment = require('moment');
const { isValidObjectId } = require('mongoose');
const axios = require('axios');

const Util = require('../../common/utils/util');
const SchoolOwner = require('../model/SchoolOwner');
const School = require('../model/School');
const ArchiveSchool = require('../model/ArchiveSchool');
require('dotenv').config();

class SchoolController {
  createSchool = async (req, res) => {
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
        admissionProcedures: 'required|array',
        subjectOffered: 'required|array',
        extracurriculumActivities: 'required|array',
        videoUrl: 'url',
        history: 'required|string',
        securityMeasure: 'required|string',
        about: 'required|string',
        schoolFeeDiscount: 'integer',
        minimumSchoolFee: 'required|integer',
        maximumSchoolFee: 'required|integer',
        applicationFee: 'required|integer',
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
        admissionProcedures,
        subjectOffered,
        extracurriculumActivities,
        videoUrl,
        about,
        history,
        securityMeasure,
        schoolFeeDiscount,
        minimumSchoolFee,
        maximumSchoolFee,
        applicationFee
      } = req.body;
      const { _id } = req.schoolOwner;

      const emailExist = await School.findOne({ email });
      if (emailExist && emailExist !== null) {
        return res.status(400).json({
          status: 'failed',
          message: `School with ${email} already exists`,
        });
      }

      const currentYear = new Date().getFullYear();
      const nextYear = new Date().getFullYear() + 1;
      const academicYear = `${currentYear}/${nextYear}`

      // Get school longitude and latitude
      const geoData = await this.getLatLng(address);

      if (geoData.latitude && geoData.longitude) {
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
          about,
          admissionRequirements,
          curriculums,
          programsOffered,
          scholarships,
          awards,
          facilityImages,
          accountNumber,
          accountName,
          bankName,
          admissionProcedures,
          subjectOffered,
          extracurriculumActivities,
          videoUrl,
          history,
          securityMeasure,
          schoolFeeDiscount,
          minimumSchoolFee,
          maximumSchoolFee,
          longitude: geoData.longitude,
          latitude: geoData.latitude,
          applicationFee,
          academicYear
        });

        await school.save();

        return res.status(201).json({
          status: 'success',
          message: 'School successfully created',
          data: {
            school,
          },
        });
      }
    } catch (error) {
      console.log('Create School Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to create school',
      });
    }
  };

  async getLatLng(address) {
    const { OPENCAGE_API_KEY, OPENCAGE_BASE_URL } = process.env;
    const apiKey = OPENCAGE_API_KEY;
    const geocodingUrl = `${OPENCAGE_BASE_URL}/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
      const response = await axios.get(geocodingUrl);
      const results = response.data.results;
      if (results.length > 0) {
        const location = results[0].geometry;
        const latitude = location.lat;
        const longitude = location.lng;
        return { latitude, longitude };
      } else {
        return 'No results found for the address';
      }
    } catch (error) {
      console.log('Error fetching geocoding data: ', error);
      return 'Error fetching geocoding data';
    }
  }

  // Fetch schools
  getSchools = async (req, res) => {
    try {
      const { _id } = req.schoolOwner;
      const schools = await School.find({ schoolOwner: _id }).sort({
        createdAt: -1,
      });

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
  };

  // Fetch school
  getSchool = async (req, res) => {
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
  };

  // Update school
  updateSchool = async (req, res) => {
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
  };

  // Update school
  deleteSchool = async (req, res) => {
    try {
      const { _id } = req.schoolOwner;
      let { schoolId } = req.params;
      if (!isValidObjectId(schoolId)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid school ID',
        });
      }

      const school = await School.findOne({ _id: schoolId, schoolOwner: _id });
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
  };
}

module.exports = new SchoolController();
