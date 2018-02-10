angular.module('app', [])

.controller('mainController', ['service', function(service) {
    
	var self = this;
	
	this.generateTableResults = function() {
		
		//randomly create arrays of entities with tables
		self.measures = _.range(1,_.random(2, 5)).map(function() {
			return service.generateEntity();
		})
		self.dimensions = _.range(0,_.random(0, 4)).map(function() {
			return service.generateEntity();
		})
		self.filters = _.range(0,_.random(0, 3)).map(function() {
			return service.generateEntity();
		})
		
		//an object that has the count of inclusions and a unique array of entity names associated 
		let tablesInclusionCounter = service.totalTableInclusions(self.measures, self.dimensions, self.filters);
		
		//finds the optimized table
		self.bestTable = service.findBestTable(tablesInclusionCounter);
	}
}])


.service('service', function() {
	//default tables
    this.AVAILABLE_TABLES = ['member', 'medical', 'rx', 'disability'];
	
    this.generateEntity = function() {
        var supportedTables = [];
		
		//make a copy of the available tables
		let tablesLeft = [...this.AVAILABLE_TABLES];
		
		//randomly grabs 1-3 unique tables
		let randomMaxEntities = _.random(1, 3);
		for(let i = 0; i < randomMaxEntities; i++) {
			let randomIndex = _.random(0, tablesLeft.length-1);
			let entity = tablesLeft.splice(randomIndex,1);
			supportedTables.push(entity[0]);
		}

        return {supportedTables: supportedTables}
    }
	
	//Given populated entities, returns an object that keeps track each tables count related entities
	//OPTIMIZED: Uses IIFE to so that other function is not instantiated each time.
	this.totalTableInclusions = (()=> {
		
		//Initiates an object that contains a key for each table 
		//and a place to store a count for each inclusion as well as which entities types it is included in.
		const tablesInclusionCounterEmpty = this.AVAILABLE_TABLES.reduce((acc,cur,i)=> {
			acc[cur] = {count: 0, entityTypes: []};
			return acc;
		}, {});
		
		//totals the number of times a table is included within an entity
		function populateInclusionCounter (entityName, entityArr, tablesInclusionCounter) {
			entityArr.forEach(entity => {
				entity.supportedTables.forEach(table => {
					tablesInclusionCounter[table].count += 1;
					
					//add entity name only if it does not yet exist
					if(tablesInclusionCounter[table].entityTypes.indexOf(entityName) === -1)
						tablesInclusionCounter[table].entityTypes.push(entityName);
				});
			});
		}
		
		//the primary function that will be returned from the IIFE
		function totalTableInclusions(measures, dimensions, filters) {
			let tablesInclusionCounter = JSON.parse(JSON.stringify(tablesInclusionCounterEmpty));
			
			//list all entities with keys the same name as entityTypes
			let keyedEntities = {measures, dimensions, filters};
			
			//step through each entity to add total occurrences of tables
			for(let key in keyedEntities)
				populateInclusionCounter(key, keyedEntities[key], tablesInclusionCounter);
			
			return tablesInclusionCounter;
		}
		return totalTableInclusions;
	})();
	
	//finds the table with the most inclusions, is associated with measures 
	//and for ties counts most unique entity types
    this.findBestTable = function(tablesInclusionCounter) {
        var table = '';

		//find the best table from results
		let bestTable = null;
		for(let key in tablesInclusionCounter) {
			//to be a valid table, it must be within measures
			if(tablesInclusionCounter[key].entityTypes.indexOf("measures")!==-1) {
				if(bestTable === null || tablesInclusionCounter[key].count > bestTable.count)
					bestTable = {[key]:tablesInclusionCounter[key]};
				else if(tablesInclusionCounter[key].count === bestTable.count && tablesInclusionCounter[key].entityTypes.length > bestTable.entityTypes.length)
					bestTable = {[key]:tablesInclusionCounter[key]}; //tie breaker
			}
		}
		
		//grab the table name and return it as the best table
		let key = Object.keys(bestTable);
		table = key[0];
        return table;
    }
})
