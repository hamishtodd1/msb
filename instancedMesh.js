function initInstancedMesh() {
    const _instanceLocalMatrix = new THREE.Matrix4();
    const _instanceWorldMatrix = new THREE.Matrix4();

    const _instanceIntersects = [];

    const _mesh = new THREE.Mesh();



    const dummy = new THREE.Object3D()


    THREE.InstancedMesh = function(geometry, material, count) {

        THREE.Mesh.call(this, geometry, material);

        this.instanceMatrix = new THREE.BufferAttribute(new Float32Array(count * 16), 16);
        log(this.instanceMatrix)
        this.instanceColor = null;

        this.count = count;

        this.frustumCulled = false;

    }

    THREE.InstancedMesh.prototype = Object.assign(Object.create(THREE.Mesh.prototype), {

        constructor: THREE.InstancedMesh,

        isInstancedMesh: true,

        copy: function (source) {

            THREE.Mesh.prototype.copy.call(this, source);

            this.instanceMatrix.copy(source.instanceMatrix);

            if (source.instanceColor !== null) this.instanceColor = source.instanceColor.clone();

            this.count = source.count;

            return this;

        },

        getColorAt: function (index, color) {

            color.fromArray(this.instanceColor.array, index * 3);

        },

        getMatrixAt: function (index, matrix) {

            matrix.fromArray(this.instanceMatrix.array, index * 16);

        },

        raycast: function (raycaster, intersects) {

            const matrixWorld = this.matrixWorld;
            const raycastTimes = this.count;

            _mesh.geometry = this.geometry;
            _mesh.material = this.material;

            if (_mesh.material === undefined) return;

            for (let instanceId = 0; instanceId < raycastTimes; instanceId++) {

                // calculate the world matrix for each instance

                this.getMatrixAt(instanceId, _instanceLocalMatrix);

                _instanceWorldMatrix.multiplyMatrices(matrixWorld, _instanceLocalMatrix);

                // the mesh represents this single instance

                _mesh.matrixWorld = _instanceWorldMatrix;

                _mesh.raycast(raycaster, _instanceIntersects);

                // process the result of raycast

                for (let i = 0, l = _instanceIntersects.length; i < l; i++) {

                    const intersect = _instanceIntersects[i];
                    intersect.instanceId = instanceId;
                    intersect.object = this;
                    intersects.push(intersect);

                }

                _instanceIntersects.length = 0;

            }

        },

        setColorAt: function (index, color) {

            if (this.instanceColor === null) {

                this.instanceColor = new THREE.BufferAttribute(new Float32Array(this.count * 3), 3);

            }

            color.toArray(this.instanceColor.array, index * 3);

        },

        setMatrixAt: function (index, matrix) {

            matrix.toArray(this.instanceMatrix.array, index * 16);

        },

        setPositionAt: function(i, x, y) {
            this.getMatrixAt(i, dummy.matrix)
            dummy.position.x = x
            dummy.position.y = y
            this.setMatrixAt(i, dummy.matrix)

            this.instanceMatrix.updateRange.count = this.count
        },

        updateMorphTargets: function () {

        },

        dispose: function () {

            this.dispatchEvent({ type: 'dispose' });

        }

    });
}