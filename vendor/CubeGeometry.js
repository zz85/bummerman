/**
 * @author mrdoob / http://mrdoob.com/
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Cube.as
 */

THREE.CubeGeometry = function ( width, height, depth, widthSegments, heightSegments, depthSegments ) {

	THREE.Geometry.call( this );

	var scope = this;

	this.width = width;
	this.height = height;
	this.depth = depth;

	this.widthSegments = widthSegments || 1;
	this.heightSegments = heightSegments || 1;
	this.depthSegments = depthSegments || 1;

	var width_half = this.width / 2;
	var height_half = this.height / 2;
	var depth_half = this.depth / 2;

	buildPlane( 'z', 'y', - 1, - 1, this.depth, this.height, width_half, 0 ); // px
	buildPlane( 'z', 'y',   1, - 1, this.depth, this.height, - width_half, 1 ); // nx
	buildPlane( 'x', 'z',   1,   1, this.width, this.depth, height_half, 2 ); // py
	buildPlane( 'x', 'z',   1, - 1, this.width, this.depth, - height_half, 3 ); // ny
	buildPlane( 'x', 'y',   1, - 1, this.width, this.height, depth_half, 4 ); // pz
	buildPlane( 'x', 'y', - 1, - 1, this.width, this.height, - depth_half, 5 ); // nz

	function buildPlane( u, v, udir, vdir, width, height, depth, materialIndex ) {

		var w, ix, iy,
		gridX = scope.widthSegments,
		gridY = scope.heightSegments,
		width_half = width / 2,
		height_half = height / 2,
		offset = scope.vertices.length;

		if ( ( u === 'x' && v === 'y' ) || ( u === 'y' && v === 'x' ) ) {

			w = 'z';

		} else if ( ( u === 'x' && v === 'z' ) || ( u === 'z' && v === 'x' ) ) {

			w = 'y';
			gridY = scope.depthSegments;

		} else if ( ( u === 'z' && v === 'y' ) || ( u === 'y' && v === 'z' ) ) {

			w = 'x';
			gridX = scope.depthSegments;

		}

		var gridX1 = gridX + 1,
		gridY1 = gridY + 1,
		segment_width = width / gridX,
		segment_height = height / gridY,
		normal = new THREE.Vector3();

		normal[ w ] = depth > 0 ? 1 : - 1;

		for ( iy = 0; iy < gridY1; iy ++ ) {

			for ( ix = 0; ix < gridX1; ix ++ ) {

				var vector = new THREE.Vector3();
				vector[ u ] = ( ix * segment_width - width_half ) * udir;
				vector[ v ] = ( iy * segment_height - height_half ) * vdir;
				vector[ w ] = depth;

				scope.vertices.push( vector );

			}

		}

		for ( iy = 0; iy < gridY; iy++ ) {

			for ( ix = 0; ix < gridX; ix++ ) {

				var a = ix + gridX1 * iy;
				var b = ix + gridX1 * ( iy + 1 );
				var c = ( ix + 1 ) + gridX1 * ( iy + 1 );
				var d = ( ix + 1 ) + gridX1 * iy;

				var face = new THREE.Face4( a + offset, b + offset, c + offset, d + offset );
				face.normal.copy( normal );
				face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone(), normal.clone() );
				face.materialIndex = materialIndex;

				scope.faces.push( face );
				scope.faceVertexUvs[ 0 ].push( [
							new THREE.Vector2( ix / gridX, 1 - iy / gridY ),
							new THREE.Vector2( ix / gridX, 1 - ( iy + 1 ) / gridY ),
							new THREE.Vector2( ( ix + 1 ) / gridX, 1- ( iy + 1 ) / gridY ),
							new THREE.Vector2( ( ix + 1 ) / gridX, 1 - iy / gridY )
						] );

			}

		}

	}

	// this.computeCentroids();
	THREE.computeCentroids(this);
	this.mergeVertices();

};

THREE.CubeGeometry.prototype = Object.create( THREE.Geometry.prototype );


/*
THREE.CubeGeometry.prototype.computeCentroids = function () {

		THREE.computeCentroids(this);
};
*/

THREE.computeCentroids = function (geometry) {

		var f, fl, face;

		for ( f = 0, fl = geometry.faces.length; f < fl; f ++ ) {

				face = geometry.faces[ f ];
				if (!face.centroid) face.centroid = new THREE.Vector3();
				face.centroid.set( 0, 0, 0 );

				if ( face instanceof THREE.Face3 ) {

						face.centroid.add( geometry.vertices[ face.a ] );
						face.centroid.add( geometry.vertices[ face.b ] );
						face.centroid.add( geometry.vertices[ face.c ] );
						face.centroid.divideScalar( 3 );

				} else if ( face instanceof THREE.Face4 ) {

						face.centroid.add( geometry.vertices[ face.a ] );
						face.centroid.add( geometry.vertices[ face.b ] );
						face.centroid.add( geometry.vertices[ face.c ] );
						face.centroid.add( geometry.vertices[ face.d ] );
						face.centroid.divideScalar( 4 );

				}

		}
};


THREE.CubeGeometry.prototype.mergeVertices = function () {
	THREE.mergeVertices( this );
}

THREE.mergeVertices = function ( geometry ) {

	var verticesMap = {}; // Hashmap for looking up vertice by position coordinates (and making sure they are unique)
	var unique = [], changes = [];

	var v, key;
	var precisionPoints = 4; // number of decimal points, eg. 4 for epsilon of 0.0001
	var precision = Math.pow( 10, precisionPoints );
	var i,il, face;
	var indices, k, j, jl, u;

	// reset cache of vertices as it now will be changing.
	geometry.__tmpVertices = undefined;

	for ( i = 0, il = geometry.vertices.length; i < il; i ++ ) {

		v = geometry.vertices[ i ];
		key = [ Math.round( v.x * precision ), Math.round( v.y * precision ), Math.round( v.z * precision ) ].join( '_' );

		if ( verticesMap[ key ] === undefined ) {

			verticesMap[ key ] = i;
			unique.push( geometry.vertices[ i ] );
			changes[ i ] = unique.length - 1;

		} else {

			//console.log('Duplicate vertex found. ', i, ' could be using ', verticesMap[key]);
			changes[ i ] = changes[ verticesMap[ key ] ];

		}

	};


	// if faces are completely degenerate after merging vertices, we
	// have to remove them from the geometry.
	var faceIndicesToRemove = [];

	for( i = 0, il = geometry.faces.length; i < il; i ++ ) {

		face = geometry.faces[ i ];

		if ( face instanceof THREE.Face3 ) {

			face.a = changes[ face.a ];
			face.b = changes[ face.b ];
			face.c = changes[ face.c ];

			indices = [ face.a, face.b, face.c ];

			var dupIndex = -1;

			// if any duplicate vertices are found in a Face3
			// we have to remove the face as nothing can be saved
			for ( var n = 0; n < 3; n ++ ) {
				if ( indices[ n ] == indices[ ( n + 1 ) % 3 ] ) {

					dupIndex = n;
					faceIndicesToRemove.push( i );
					break;

				}
			}

		} else if ( face instanceof THREE.Face4 ) {

			face.a = changes[ face.a ];
			face.b = changes[ face.b ];
			face.c = changes[ face.c ];
			face.d = changes[ face.d ];

			// check dups in (a, b, c, d) and convert to -> face3

			indices = [ face.a, face.b, face.c, face.d ];

			var dupIndex = -1;

			for ( var n = 0; n < 4; n ++ ) {

				if ( indices[ n ] == indices[ ( n + 1 ) % 4 ] ) {

					// if more than one duplicated vertex is found
					// we can't generate any valid Face3's, thus
					// we need to remove geometry face complete.
					if ( dupIndex >= 0 ) {

						faceIndicesToRemove.push( i );

					}

					dupIndex = n;

				}
			}

			if ( dupIndex >= 0 ) {

				indices.splice( dupIndex, 1 );

				var newFace = new THREE.Face3( indices[0], indices[1], indices[2], face.normal, face.color, face.materialIndex );

				for ( j = 0, jl = geometry.faceVertexUvs.length; j < jl; j ++ ) {

					u = geometry.faceVertexUvs[ j ][ i ];

					if ( u ) {
						u.splice( dupIndex, 1 );
					}

				}

				if( face.vertexNormals && face.vertexNormals.length > 0) {

					newFace.vertexNormals = face.vertexNormals;
					newFace.vertexNormals.splice( dupIndex, 1 );

				}

				if( face.vertexColors && face.vertexColors.length > 0 ) {

					newFace.vertexColors = face.vertexColors;
					newFace.vertexColors.splice( dupIndex, 1 );
				}

				geometry.faces[ i ] = newFace;
			}

		}

	}

	for ( i = faceIndicesToRemove.length - 1; i >= 0; i -- ) {

		geometry.faces.splice( i, 1 );

		for ( j = 0, jl = geometry.faceVertexUvs.length; j < jl; j ++ ) {

			geometry.faceVertexUvs[ j ].splice( i, 1 );

		}

	}

	// Use unique set of vertices

	var diff = geometry.vertices.length - unique.length;
	geometry.vertices = unique;
	return diff;

}