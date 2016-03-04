/**
 * @fileOverview Optimizely Client for Node
 * @name Optimizely Client
 * @author Arun
 * @version 0.6.2
 */

/** @access private */
var Promise = require("bluebird");
var rest = require('restler');

/** @const*/
var methodNamesToPromisify =
  "get post put del head patch json postJson putJson".split(" ");

var EventEmitterPromisifier = function(originalMethod) {
  // return a function
  return function promisified() {
    var args = [].slice.call(arguments);
    // Needed so that the original method can be called with the correct receiver
    var self = this;
    // which returns a promise
    return new Promise(function(resolve, reject) {
      // We call the originalMethod here because if it throws,
      // it will reject the returned promise with the thrown error
      var emitter = originalMethod.apply(self, args);

      emitter
        .on("success", function(data) {
          resolve(data);
        })
        .on("fail", function(data) {
          //Failed Responses including 400 status codes
          reject(data);
        })
        .on("error", function(err) {
          //Internal Error
          reject(err);
        })
        .on("abort", function() {
          reject(new Promise.CancellationError());
        })
        .on("timeout", function() {
          reject(new Promise.TimeoutError());
        });
    });
  };
};

Promise.promisifyAll(rest, {
  filter: function(name) {
    return methodNamesToPromisify.indexOf(name) > -1;
  },
  promisifier: EventEmitterPromisifier
});
////////////////
//0. Constructor
////////////////
/**
 * @public
 * @Constructor
 * @name OptimizelyClient
 * @since 0.0.1
 * @description Optimizely Client Constructor
 * @param {string} apiToken The Optimizely API Token
 * @param {object} options to define custom {string} 'url' or {boolean} OAuth2
 * @return {OptimizelyClient} The newly created optimizely client.
 * @throws {error} Throws an error if apiToken is not provided
 * @example
 * var apiToken = "*";//Get token from www.optimizely.com/tokens
 * var oc = new OptimizelyClient(API_TOKEN);
 */
var OptimizelyClient = function(apiToken, options) {
    //initialize
    if (!apiToken) throw new Error("Required: apiToken");
    this.apiToken = String(apiToken);
    this.baseUrl = (options && options.url) ? options.url : 'https://www.optimizelyapis.com/experiment/v1/';
    if(options && options.OAuth2){
      this.baseHeaders = {
        'Authorization': 'Bearer ' + this.apiToken,
        'Content-Type': 'application/json'
      }

    } else {
      this.baseHeaders = {
        'Token': this.apiToken,
        'Content-Type': 'application/json'
      }  
    }

  }
  ////////////////
  //1. Projects
  ////////////////

/**
 * @pubilc
 * @name OptimizelyClient#createProject
 * @since 0.0.1
 * @description Create a project in Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param project_name
 *   @param {string} [status = "Archived|Active"]
 *   @param {boolean} [include_jquery = false]
 *   @param {string} [ip_filter=""]
 * }
 * @returns {promise} A promise fulfilled with the created project
 * @example
 * oc.createProject({
 * project_name:"sample project name",
 * project_status:"Active",
 * include_jquery:false,
 * ip_filter:""
 * })
 * .then(function(createdProject){
 *     //...do something with created project
 * })
 * .then(null,function(error){
 *     //handle error
 * })
 */
OptimizelyClient.prototype.createProject = function(options) {
    options = options || {};
    options.project_name = options.project_name || "";
    options.project_status = options.project_status || "Active";
    options.include_jquery = !!options.include_jquery;
    //TODO:Check for truthiness
    options.ip_filter = options.ip_filter || "";
    var postUrl = this.baseUrl + 'projects/';
    return rest.postAsync(postUrl, {
      method: 'post',
      headers: this.baseHeaders,
      data: JSON.stringify(options)
    })
  }
/**
 * @pubilc
 * @name OptimizelyClient#getProject
 * @since 0.0.1
 * @description Retrieve a project from Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string} id
 * }
 * @note the id may be passed as a string instead of a member of an object
 */
OptimizelyClient.prototype.getProject = function(options) {
    if (typeof options === "string" || typeof options === "number") options = {
      id: options
    };
    options = options || {};
    options.id = String(options.id || "");
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'projects/' + options.id;
    return rest.getAsync(theUrl, {
      method: 'get',
      headers: this.baseHeaders
    });
  }
/**
 * @public
 * @name  OptimizelyClient#updateProject
 * @since  0.2.0
 * @description  Update an Existing Project in Optimizely
 * @param  {object} options object with the following properties: 
 * {
 *   @param {String}  id 
 *   @param {String}  [project_name]
 *   @param {String}  [project_status = "Active|Archived"] 
 *   @param {Boolean} [include_jquery] 
 *   @param {String}  [project_javascript] 
 *   @param {Boolean} [enable_force_variation] 
 *   @param {Boolean} [exclude_disabled_experiments]  
 *   @param {Boolean} [exclude_names]
 *   @param {Boolean} [ip_anonymization]  
 *   @param {String}  [ip_filtering] 
 * }
 * @return {promise}  A promise fulfilled with the updated project
 */
OptimizelyClient.prototype.updateProject = function(options) {
    options = options || {};
    options.id = options.id || false;
    if(!options.id) throw new Error('required: options.id');
    var putUrl = this.baseUrl + 'projects/' + options.id;
    return rest.putAsync(putUrl, {
      method: 'put',
      headers: this.baseHeaders,
      data: JSON.stringify(options)
    });
  }
/**
 * @public
 * @name  OptimizelyClient#getProjectList
 * @since  0.1.0
 * @description Retrieves a list of projects from Optimizely
 * @return {promise} A promise fulfilled with an array of all projects
 *
 */
OptimizelyClient.prototype.getProjects = function(){
    var theUrl = this.baseUrl + 'projects/';
    return rest.getAsync(theUrl, {
      method: 'get',
      headers: this.baseHeaders
    });
  }

////////////////
//2. Experiments
////////////////

/**
 *@pubilc
 *@name OptimizelyClient#createExperiment
 *@since 0.0.1
 *@description create an experiment in Optimizely
 */
OptimizelyClient.prototype.createExperiment = function(options) {
    options = options || {};
    options.description = options.description || "";
    options.project_id = options.project_id || "";
    options.edit_url = options.edit_url || "";
    options.custom_css = options.custom_css || "";
    options.custom_js = options.custom_js || "";
    if (!options.edit_url) throw new Error("Required: options.edit_url");
    if (!options.project_id) throw new Error("Required: options.project_id");
    var postUrl = this.baseUrl + 'projects/' + options.project_id +
      '/experiments/';
    delete options.project_id;
    return rest.postAsync(postUrl, {
      method: 'post',
      headers: this.baseHeaders,
      data: JSON.stringify(options)
    })
  }
/**
 *@pubilc
 *@name OptimizelyClient#getExperiment
 *@since 0.0.1
 *@description Retrieve an experiment by id/object.id
 *@param {object} options An object with the following properties:
 *{
 *  @param id
 *}
 *@note the id may be passed as a string instead of a member of an object
 */
OptimizelyClient.prototype.getExperiment = function(options) {
    if (typeof options === "string" || typeof options === "number") options = {
      id: options
    };
    options = options || {};
    options.id = String(options.id || "");
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'experiments/' + options.id;
    return rest.getAsync(theUrl, {
      method: 'get',
      headers: this.baseHeaders
    });
  }
/**
 *@pubilc
 *@name OptimizelyClient#updateExperiment
 *@since 0.0.1
 *@description Update an experiment
 *@param {object} options An object with the following properties:
 *{
 *  @param id
 *  @param {string} [status = "Draft|Active"]
 *  @param {boolean} [include_jquery = false]
 *  @param {string} [ip_filter=""]
 *}
 */
OptimizelyClient.prototype.updateExperiment = function(options) {
    options = options || {};
    options.id = String(options.id || "");
    options.description = options.description || "";
    options.edit_url = options.edit_url || "";
    options.custom_css = options.custom_css || "";
    options.custom_js = options.custom_js || "";
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'experiments/' + options.id;
    delete options.id
    return rest.putAsync(theUrl, {
      method: 'put',
      headers: this.baseHeaders,
      data: JSON.stringify(options)
    })
  }
/**
 *@pubilc
 *@name OptimizelyClient#pushExperiment
 *@since 0.2.0
 *@description Create or update an experiment based on presence of an id
 *@param {object} options An object with the following properties:
 *{
 *  @param See createExperiment and updateExperiment

 *}
 */
OptimizelyClient.prototype.pushExperiment = function(options) {
      options = options || {};
      options.id = options.id || "";
      return options.id ?
        this.updateExperiment(options):
        this.createExperiment(options);
    }
/**
 *@pubilc
 *@name OptimizelyClient#getExperiments
 *@since 0.0.1
 *@description Retrieve all experiments associatd with a given project
 *@param {object} options An object with the following properties:
 *{
 *  @param {string} project_id
 *}
 *@note the id may be passed as a string instead of a member of an object
 */
OptimizelyClient.prototype.getExperiments = function(options) {
    if (typeof options === "string" || typeof options === "number") options = {
      project_id: options
    };
    options = options || {};
    options.project_id = String(options.project_id || "");
    if (!options.project_id) throw new Error("required: options.project_id");
    var theUrl = this.baseUrl + 'projects/' + options.project_id +
      '/experiments/';
    return rest.getAsync(theUrl, {
      method: 'get',
      headers: this.baseHeaders
    })
  }

/**
 *@pubilc
 *@name OptimizelyClient#updateExperimentByDescription
 *@since 0.0.1
 *@description Get an experiment description
 *@param {object} options An object with the following properties:
 *{
 *  @param project_name
 *  @param {string} [status = "Draft|Active"]
 *  @param {boolean} [include_jquery = false]
 *  @param {string} [ip_filter=""]
 *}
 */
OptimizelyClient.prototype.getExperimentByDescription = function(options) {
    if (typeof options === "string") options = {
      project_id: options
    };
    options = options || {};
    options.project_id = String(options.project_id || "");
    options.description = options.description || arguments[1];
    if (!options.project_id) throw new Error("Required: options.project_id");
    if (!options.description) throw new Error("Required: options.description");
    return this.getExperiments(options.project_id).then(function(data) {
      if (typeof data === "string") data = JSON.parse(data);
      for (var i in data) {
        if (data[i]['description'] ===
          options.description) {
          return data[i];
        };
      }
      return null;
    })
  }
/**
 *@pubilc
 *@name OptimizelyClient#deleteExperiment
 *@since 0.2.0
 *@description Delete an experiment by id/object.id
 *@param {object} options An object with the following properties:
 *{
 *  @param id
 *}
 *@note the id may be passed as a string/number instead of a member of an object
 */
OptimizelyClient.prototype.deleteExperiment = function(options) {
    if (typeof options === "string" || typeof options === "number") options = {
      id: options
    };
    options = options || {};
    options.id = String(options.id || "");
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'experiments/' + options.id;
    return rest.delAsync(theUrl, {
      method: 'delete',
      headers: this.baseHeaders
    });
  }
/**
 * @public
 * @name  OptimizelyClient#getResults
 * @since  0.4.0
 * @description get non-stats engine results
 * @param {object} options An object with the following properties: 
 * {
 *   @param {String} id Experiment ID
 *   @param {object} [dimension = {}] An object with the following properties:
 *   {
 *     @param {String} id Dimension ID
 *     @param {String} value Dimension Value
 *   }
 * }
 * @note the id may be passed as a string/number instead of a member of an object
 */
OptimizelyClient.prototype.getResults = function(options) {
    if (typeof options === "string" || typeof options === "number") options = {
      id: options
    };
    options = options || {};
    options.id = String(options.id || "");
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'experiments/' + options.id + '/results';
    if (options.dimension) {
      var urlParameters = "?";
      if (!options.dimension.id) throw new Error("required: options.dimension.id");
      if (!options.dimension.value) throw new Error("required: options.dimension.value");
      urlParameters += "dimension_id=" + encodeURIComponent(options.dimension.id);
      urlParameters += "&dimension_value=" + encodeURIComponent(options.dimension.value);
      theUrl += urlParameters;
    }
    return rest.getAsync(theUrl, {
      method: 'GET',
      headers: this.baseHeaders
    });
  }
/**
 * @public
 * @name  OptimizelyClient#getStats
 * @since  0.4.0
 * @description get stats engine results
 * @param {object} options An object with the following properties: 
 * {
 *   @param {String} id Experiment ID
 *   @param {object} [dimension = {}] An object with the following properties:
 *   {
 *     @param {String} id Dimension ID
 *     @param {String} value Dimension Value
 *   }
 * }
 * @note the id may be passed as a string/number instead of a member of an object
 */
OptimizelyClient.prototype.getStats = function(options) {
    if (typeof options === "string" || typeof options === "number") options = {
      id: options
    };
    options = options || {};
    options.id = String(options.id || "");
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'experiments/' + options.id + '/stats';
    if (options.dimension) {
      var urlParameters = "?";
      if (!options.dimension.id) throw new Error("required: options.dimension.id");
      if (!options.dimension.value) throw new Error("required: options.dimension.value");
      urlParameters += "dimension_id=" + encodeURIComponent(options.dimension.id);
      urlParameters += "&dimension_value=" + encodeURIComponent(options.dimension.value);
      theUrl += urlParameters;
    }
    return rest.getAsync(theUrl, {
      method: 'GET',
      headers: this.baseHeaders
    });
  }
////////////////
//3. Variations
////////////////
/**
 *@pubilc
 *@name OptimizelyClient#createVariation
 *@since 0.0.1
 *@description create an experiment in Optimizely
 *@param {object} options An object with the following properties:
 *{
 *  @param {string|number} experiment_id
 *  @param {string} [descriptions = ""]
 *}
 */
OptimizelyClient.prototype.createVariation = function(options) {
    options = options || {};
    options.experiment_id = String(options.experiment_id || "");
    options.description = options.description || "";
    if (!options.experiment_id) throw new Error(
      "Required: options.experiment_id");
    var postUrl = this.baseUrl + 'experiments/' + options.experiment_id +
      '/variations/';
    delete options.experiment_id;
    return rest.postAsync(postUrl, {
      method: 'post',
      headers: this.baseHeaders,
      data: JSON.stringify(options)
    })
  }
/**
 *@pubilc
 *@name OptimizelyClient#getVariation
 *@since 0.0.1
 *@description read a variation in Optimizely
 *@param {object} options An object with the following properties:
 *{
 *  @param {string|number} id
 *}
 */
OptimizelyClient.prototype.getVariation = function(options) {
    if (typeof options === "string") options = {
      id: options
    };
    if (!options.id) throw new Error("Required: options.id");
    var theUrl = this.baseUrl + 'variations/' + options.id;
    return rest.getAsync(theUrl, {
      method: 'get',
      headers: this.baseHeaders
    })
  }

/**
 * @pubilc
 * @name OptimizelyClient#updateVariation
 * @since 0.0.1
 * @description Update a variation in Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string|number} id
 *   @param {string} [description]
 * }
 */
OptimizelyClient.prototype.updateVariation = function(options) {
    var optionsToUpdate = {};
    options = options || {};
    if (!options.id) throw new Error(
      "Required: options.id");
    optionsToUpdate.id = options.id || "";
    optionsToUpdate.description = options.description || "";
    optionsToUpdate.js_component = options.js_component || "";
    var theUrl = this.baseUrl + 'variations/' + options.id;
    return rest.putAsync(theUrl, {
      method: 'put',
      headers: this.baseHeaders,
      data: JSON.stringify(optionsToUpdate)
    })
  }
/**
 * @pubilc
 * @name OptimizelyClient#pushVariation
 * @since 0.2.0
 * @description Create or update a variation based on the presence of an id
 * @param {object} options An object with the following properties:
 * {
 *    @param See createVariation and updateVariaion
 * }
 */
OptimizelyClient.prototype.pushVariation = function(options) {
    options = options || {};
    options.id = options.id || "";
    return options.id ?
      this.updateVariation(options):
      this.createVariation(options);
  }
/**
 * @pubilc
 * @name OptimizelyClient#deleteVariation
 * @since 0.1.0
 * @description delete a variation in Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string|number} id
 * }
 */
OptimizelyClient.prototype.deleteVariation = function(options) {
    if (typeof options === "string") options = {
      id: options
    };
    if (!options.id) throw new Error("Required: options.id");
    var theUrl = this.baseUrl + 'variations/' + options.id;
    return rest.delAsync(theUrl, {
      method: 'delete',
      headers: this.baseHeaders
    })
  }

////////////////
//4. Audiences
////////////////
/**
 * @pubilc
 * @name OptimizelyClient#getAudience
 * @since 0.4.0
 * @description Read an audience in Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string|number} id The Audience ID
 * }
 * @returns {promise} A promise fulfilled with the Audience
 * @note the id may be passed as a string instead of a member of an object
 */
OptimizelyClient.prototype.getAudience = function(options) {
    if (typeof options === "string") options = {
      id: options
    };
    if (!options.id) throw new Error("Required: options.id");
    var theUrl = this.baseUrl + 'audiences/' + options.id;
    return rest.getAsync(theUrl, {
      method: 'get',
      headers: this.baseHeaders
    });
  }
/**
 * @pubilc
 * @name OptimizelyClient#createAudience
 * @since 0.4.0
 * @description Create an Audience in Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {String}   id             Project ID
 *   @param {String}   name
 *   @param {String}   [description] 
 *   @param {Boolean}  [segmentation] Only available for platinum
 *   @param {Array}    [conditions]   See http://developers.optimizely.com/rest/conditions/
 * }
 * @returns {promise} A promise fulfilled with the created project
 */
OptimizelyClient.prototype.createAudience = function(options) {
    var optionsToSend = {};
    options = options || {};
    if (!options.name) throw new Error("Required: options.name");
    if (!options.id) throw new Error("Required: options.id");

    optionsToSend.name = options.name;
    optionsToSend.id = options.id;
    optionsToSend.description = options.description || "";
    optionsToSend.segmentation = options.segmentation || false;
    optionsToSend.conditions = options.conditions || [];

    var postUrl = this.baseUrl + 'projects/' + options.id + '/audiences/';
    return rest.postAsync(postUrl, {
      method: 'post',
      headers: this.baseHeaders,
      data: JSON.stringify(optionsToSend)
    })
  }
/**
 * @public
 * @name  OptimizelyClient#updateAudience
 * @since  0.4.0
 * @description  Update an Existing Project in Optimizely
 * @param  {object} options object with the following properties: 
 * {
 *   @param {String}  id 
 *   @param {String}  [name]
 *   @param {Array}   [conditions]   See http://developers.optimizely.com/rest/conditions/
 *   @param {Boolean} [segmentation] Platinum Customers only
 * }
 * @return {promise}  A promise fulfilled with the updated audience
 */
OptimizelyClient.prototype.updateAudience = function(options) {
    options = options || {};
    options.id = options.id || false;
    if(!options.id) throw new Error('required: options.id');
    var putUrl = this.baseUrl + 'audiences/' + options.id;
    return rest.putAsync(putUrl, {
      method: 'put',
      headers: this.baseHeaders,
      data: JSON.stringify(options)
    });
  }
/**
 * @public
 * @name  OptimizelyClient#getAudiences
 * @since  0.4.0
 * @description Retrieves a list of Audiences in a project from Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string|number} id The Project ID
 * }
 * @return {promise} A promise fulfilled with an array of all Audiences
 *
 */
OptimizelyClient.prototype.getAudiences = function(options){
    if (typeof options === "string" || typeof options === "number") options = {
      id: options
    };
    options = options || {};
    options.id = options.id || "";
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'projects/' + options.id + '/audiences/';
    return rest.getAsync(theUrl, {
      method: 'get',
      headers: this.baseHeaders
    });
  }

////////////////
//5. Dimensions
////////////////
/**
 * @pubilc
 * @name OptimizelyClient#getDimension
 * @since 0.5.0
 * @description Read a dimension in Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string|number} id The Dimension ID
 * }
 * @returns {promise} A promise fulfilled with the Dimension
 * @note the id may be passed as a string instead of a member of an object
 */
OptimizelyClient.prototype.getDimension = function(options) {
    if (typeof options === "string") options = {
      id: options
    };
    if (!options.id) throw new Error("Required: options.id");
    var theUrl = this.baseUrl + 'dimensions/' + options.id;
    return rest.getAsync(theUrl, {
      method: 'get',
      headers: this.baseHeaders
    });
  }
/**
 * @pubilc
 * @name OptimizelyClient#createDimension
 * @since 0.5.0
 * @description Create an Dimension in Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {String}   id             Project ID
 *   @param {String}   name
 *   @param {String}   [description] 
 *   @param {Boolean}  [client_api_name] A unique name to refer to this dimension
 * }
 * @returns {promise} A promise fulfilled with the created project
 */
OptimizelyClient.prototype.createDimension = function(options) {
    var optionsToSend = {};
    options = options || {};
    if (!options.name) throw new Error("Required: options.name");
    if (!options.id) throw new Error("Required: options.id");

    optionsToSend.name = options.name;
    optionsToSend.id = options.id;
    optionsToSend.description = options.description || "";
    optionsToSend.client_api_name = options.client_api_name || "";

    var postUrl = this.baseUrl + 'projects/' + options.id + '/dimensions/';
    return rest.postAsync(postUrl, {
      method: 'post',
      headers: this.baseHeaders,
      data: JSON.stringify(optionsToSend)
    })
  }
/**
 * @public
 * @name  OptimizelyClient#updateDimension
 * @since  0.5.0
 * @description  Update an Existing Dimension in Optimizely
 * @param  {object} options object with the following properties: 
 * {
 *   @param {String}  id 
 *   @param {String}  [name]
 *   @param {String}  [description] 
 *   @param {Boolean} [client_api_name] A unique name to refer to this dimension
 * }
 * @return {promise}  A promise fulfilled with the updated audience
 */
OptimizelyClient.prototype.updateDimension = function(options) {
    options = options || {};
    options.id = options.id || false;
    if(!options.id) throw new Error('required: options.id');
    var putUrl = this.baseUrl + 'dimensions/' + options.id;
    return rest.putAsync(putUrl, {
      method: 'put',
      headers: this.baseHeaders,
      data: JSON.stringify(options)
    });
  }
/**
 * @public
 * @name  OptimizelyClient#getDimensions
 * @since  0.5.0
 * @description Retrieves a list of Dimensions in a project from Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string|number} id The Project ID
 * }
 * @return {promise} A promise fulfilled with an array of all Audiences
 *
 */
OptimizelyClient.prototype.getDimensions = function(options){
    if (typeof options === "string" || typeof options === "number") options = {
      id: options
    };
    options = options || {};
    options.id = options.id || "";
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'projects/' + options.id + '/dimensions/';
    return rest.getAsync(theUrl, {
      method: 'get',
      headers: this.baseHeaders
    });
  }

////////////////
//6. Goals
////////////////

/**
 * @public
 * @name  OptimizelyClient#getGoals
 * @since  0.5.0
 * @description Retrieves a list of Goals in a project from Optimizely
 * @param {object} options An object with the following properties:
 * {
 *   @param {string|number} id The Project ID
 * }
 * @return {promise} A promise fulfilled with an array of all Goals
 *
 */
OptimizelyClient.prototype.getGoals = function(options){
    if (typeof options === "string" || typeof options === "number") options = {
      id: options
    };
    options = options || {};
    options.id = options.id || "";
    if (!options.id) throw new Error("required: options.id");
    var theUrl = this.baseUrl + 'projects/' + options.id + '/goals/';
    return rest.getAsync(theUrl, {
      method: 'get',
      headers: this.baseHeaders
    });
  }
module.exports = OptimizelyClient;
